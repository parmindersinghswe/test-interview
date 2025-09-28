import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger, type ServerOptions } from "vite";
import logger from "./logger.js";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { render } from "./ssr.js";

const viteLogger = createLogger();

// Paths that should be server-side rendered for improved SEO
const ssrMatchers = [
  /^\/$/, // landing page
  /^\/about$/,
  /^\/materials$/,
  /^\/materials\/[^/]+$/,
  /^\/contact$/,
  /^\/help$/,
  /^\/terms$/,
  /^\/privacy$/,
  /^\/refund$/,
];

export function log(message: string, source = "express") {
  logger.info({ source }, message);
}

export async function setupVite(app: Express, server: Server) {
  const { default: viteConfig } = await import("../vite.config.js");

  const serverOptions: ServerOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true,

  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      if (ssrMatchers.some((r) => r.test(url))) {
        const { appHtml, headTags } = render(url);
        template = template
          .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
          .replace('</head>', `${headTags}</head>`);
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(
    express.static(distPath, {
      etag: true,
      maxAge: "1y",
      immutable: true,
      setHeaders(res, servedPath) {
        if (servedPath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  app.get(ssrMatchers, async (req, res) => {
    const url = req.originalUrl;
    let template = await fs.promises.readFile(
      path.resolve(distPath, "index.html"),
      "utf-8",
    );
    const { appHtml, headTags } = render(url);
    template = template
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
      .replace('</head>', `${headTags}</head>`);
    res
      .status(200)
      .set({ "Content-Type": "text/html", "Cache-Control": "no-cache" })
      .end(template);
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
