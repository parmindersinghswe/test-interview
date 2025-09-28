import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import csrf from "csurf";
import fs from "fs/promises";
import path from "path";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import logger from "./logger.js";
import rateLimit from "express-rate-limit";
import { generateSitemap } from "./sitemap.js";
import { describeConnectionStringForLogs, env } from "./config.js";
import { pool } from "./db.js";

const app = express();
app.set("case sensitive routing", true);
const allowedDomains = env.ALLOWED_DOMAINS;
const razorpayWebhookPath = "/razorpay-webhook";

const ROBOTS_TEMPLATE_FALLBACK = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin",
  "Disallow: /api",
  "Sitemap: {{SITE_URL}}/sitemap.xml",
].join("\n");

const robotsTemplatePaths = [
  path.resolve(import.meta.dirname, "..", "public", "robots.txt"),
  path.resolve(import.meta.dirname, "public", "robots.txt"),
  path.resolve(import.meta.dirname, "..", "client", "public", "robots.txt"),
];

let cachedRobotsTemplate: string | null = null;

async function getRobotsTemplate(): Promise<string> {
  if (cachedRobotsTemplate !== null) {
    return cachedRobotsTemplate;
  }

  for (const templatePath of robotsTemplatePaths) {
    try {
      const content = await fs.readFile(templatePath, "utf-8");
      cachedRobotsTemplate = content;
      return content;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        logger.warn({ error: nodeError, templatePath }, "Failed to read robots.txt template");
      }
    }
  }

  cachedRobotsTemplate = ROBOTS_TEMPLATE_FALLBACK;
  return cachedRobotsTemplate;
}

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    // Allow the structured data script in client/index.html
    "'sha256-vKeA/HCUNidMGrdf5eUBmba0mbP5mDlD6kylM8lTPKs='",
    "https://replit.com",
    "https://checkout.razorpay.com",
  ],
  styleSrc: [
    "'self'",
    // React components use inline styles
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
  ],
  imgSrc: ["'self'", "data:", "https:"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  connectSrc: ["'self'", "https://ipapi.co", "https://checkout.razorpay.com", ...allowedDomains],
  objectSrc: ["'none'"],
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
  })
);
app.use(cors({ origin: allowedDomains, credentials: true }));
app.use(razorpayWebhookPath, express.raw({ type: "application/json" }));
const jsonParser = express.json();
app.use((req, res, next) => {
  if (req.originalUrl.startsWith(razorpayWebhookPath)) {
    return next();
  }

  return jsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  if (req.path !== req.path.toLowerCase()) {
    res
      .status(404)
      .json({
        message: `Route not found. Paths are case-sensitive. Did you mean ${req.path.toLowerCase()}?`,
      });
    return;
  }
  next();
});
app.use(compression());
// Metrics for rate-limit violations
const rateLimitMetrics = {
  global: 0,
  login: 0,
  payment: 0,
};

// Global rate limiting for all API routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    rateLimitMetrics.global++;
    res.status(options.statusCode).send(options.message);
  },
});
app.use("/api", globalLimiter);

// Stricter limits for sensitive routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    rateLimitMetrics.login++;
    res.status(options.statusCode).send(options.message);
  },
});
app.use("/api/auth/login", loginLimiter);

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, _next, options) => {
    rateLimitMetrics.payment++;
    res.status(options.statusCode).send(options.message);
  },
});
app.use(["/create-order", "/confirm-success"], paymentLimiter);

// Session configuration backed by Postgres
const sessionSecret = env.SESSION_SECRET;
const databaseUrl = env.SESSION_DB_URL || env.DATABASE_URL;

const PgSession = connectPg(session);
const sessionStore = (() => {
  const logContext = {
    databaseClient: env.DATABASE_CLIENT,
    databaseUrl: describeConnectionStringForLogs(databaseUrl),
    store: "connect-pg-simple",
  } as const;

  try {
    const store = new PgSession({
      conString: databaseUrl,
      createTableIfMissing: true,
    });

    logger.info(logContext, "Initialized session store");

    return store;
  } catch (error) {
    logger.error({ ...logContext, error }, "Failed to initialize session store");
    throw error;
  }
})();

app.use(session({
  store: sessionStore,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV !== "development",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

const csrfProtection = csrf();
const csrfExemptRoutes = ["/api/auth/login", "/api/auth/register"];
app.use((req, res, next) => {
  if (csrfExemptRoutes.includes(req.path)) {
    return next();
  }
  csrfProtection(req, res, next);
});

const sensitiveKeys = ["password", "token", "secret", "authorization"];

function redactSensitive(data: any): any {
  if (Array.isArray(data)) {
    return data.map(redactSensitive);
  }
  if (data && typeof data === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactSensitive(value);
      }
    }
    return result;
  }
  return data;
}

const verboseLogging = env.VERBOSE_LOGGING;

app.use((req, res, next) => {
  if (!verboseLogging) {
    return next();
  }

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = redactSensitive(bodyJson);
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.get("/metrics", (_req, res) => {
  res.json(rateLimitMetrics);
});

// choose which set of routes to load based on environment
(async () => {
  const server = await registerRoutes(app);

  const shutdownSignals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  let isShuttingDown = false;

  const gracefulShutdown = (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, "Received termination signal. Shutting down server");

    server.close((closeError) => {
      if (closeError) {
        logger.error({ error: closeError }, "Error while closing HTTP server");
      } else {
        logger.info("HTTP server closed");
      }

      void pool
        .end()
        .then(() => {
          logger.info("Database pool closed");
          process.exit(closeError ? 1 : 0);
        })
        .catch((error) => {
          logger.error({ error }, "Failed to close database pool");
          process.exit(1);
        });
    });
  };

  shutdownSignals.forEach((signal) => {
    process.once(signal, () => gracefulShutdown(signal));
  });

  // Dynamically generate sitemap
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const xml = await generateSitemap();
      res.header('Content-Type', 'application/xml').send(xml);
    } catch (err) {
      logger.error({ err }, 'Error generating sitemap');
      res.status(500).send('Unable to generate sitemap');
    }
  });

  app.get('/robots.txt', async (_req, res) => {
    try {
      const template = await getRobotsTemplate();
      const content = template.replace(/{{\s*SITE_URL\s*}}/g, env.SITE_URL);
      res.type('text/plain').send(content);
    } catch (error) {
      logger.error({ error }, 'Failed to render robots.txt');
      const fallback = ROBOTS_TEMPLATE_FALLBACK.replace(/{{\s*SITE_URL\s*}}/g, env.SITE_URL);
      res.type('text/plain').send(fallback);
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ message: "Invalid CSRF token" });
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the configured port
  // defaults to 5000 when PORT is not provided.
  const port = env.PORT;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
