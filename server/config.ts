import { z } from "zod";
import logger from "./logger.js";
import { DEFAULT_SITE_URL, resolveSiteUrl } from "../shared/site-config.js";

const MASK_PREVIEW_LENGTH = 4;
const CONNECTION_PREVIEW_MAX_LENGTH = 80;

export interface ConnectionStringSnapshot {
  provided: boolean;
  preview?: string;
  protocol?: string;
  host?: string;
  port?: string;
  database?: string;
  searchParams?: string[];
  username?: string;
  password?: string;
  length?: number;
  parseError?: string;
  reason?: string;
}

interface MaskValueOptions {
  maskedLength?: number;
  maskChar?: string;
}

export const maskValueForLogs = (
  value: string | null | undefined,
  options?: MaskValueOptions,
): string | undefined => {
  const { maskedLength = MASK_PREVIEW_LENGTH, maskChar = "*" } = options ?? {};

  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = `${value}`;

  if (normalized.length === 0) {
    return undefined;
  }

  const maskCount = Math.min(maskedLength, normalized.length);
  const mask = maskChar.repeat(maskCount);

  return normalized.length > maskedLength ? `${mask}…` : mask;
};

const buildConnectionPreview = (
  protocol: string,
  auth: string,
  hostname: string,
  port: string,
  pathname: string,
  searchKeys: string[],
) => {
  const sanitizedPath = pathname && pathname !== "/" ? pathname : "";
  const query = searchKeys.length > 0 ? `?${searchKeys.join("&")}` : "";
  const preview = `${protocol}//${auth}${hostname}${port ? `:${port}` : ""}${sanitizedPath}${query}`;

  if (preview.length <= CONNECTION_PREVIEW_MAX_LENGTH) {
    return preview;
  }

  return `${preview.slice(0, CONNECTION_PREVIEW_MAX_LENGTH)}…`;
};

export const describeConnectionStringForLogs = (
  connectionString: string | null | undefined,
): ConnectionStringSnapshot => {
  if (!connectionString) {
    return { provided: false };
  }

  const normalized = connectionString.trim();

  if (!normalized) {
    return { provided: false };
  }

  try {
    const url = new URL(normalized);
    const searchKeys = Array.from(new Set(url.searchParams.keys()));
    const maskedUsername = maskValueForLogs(url.username);
    const maskedPassword = maskValueForLogs(url.password);
    const authParts = [] as string[];

    if (maskedUsername) {
      authParts.push(maskedUsername);
    }

    if (maskedPassword) {
      authParts.push(maskedPassword);
    }

    const auth = authParts.length > 0 ? `${authParts.join(":")}@` : "";
    const preview = buildConnectionPreview(
      url.protocol,
      auth,
      url.hostname,
      url.port,
      url.pathname,
      searchKeys,
    );
    const databasePath = url.pathname.replace(/^\/+/, "");

    return {
      provided: true,
      preview,
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname || undefined,
      port: url.port || undefined,
      database: databasePath || undefined,
      searchParams: searchKeys,
      username: maskedUsername,
      password: maskedPassword,
      length: normalized.length,
    };
  } catch (error) {
    const maskedPreview = maskValueForLogs(normalized, { maskedLength: Math.min(16, normalized.length) });

    return {
      provided: true,
      preview: maskedPreview,
      length: normalized.length,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().optional(),
  JWT_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  DATABASE_CLIENT: z.preprocess(
    (value) => (typeof value === "string" ? value.toLowerCase() : value),
    z.enum(["pg", "neon"]).default("pg"),
  ),
  SESSION_DB_URL: z.string().optional(),
  ALLOWED_DOMAINS: z.string().optional(),
  VERBOSE_LOGGING: z.string().optional(),
  ADMIN_USERNAME: z.string().optional(),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  BASE_URL: z.string().optional(),
  SITE_URL: z.string().optional(),
  REPLIT_DOMAINS: z.string().optional(),
  ISSUER_URL: z.string().optional(),
  REPL_ID: z.string().optional(),
  ADMIN_SETUP_ALLOWED_IDS: z.string().optional(),
  ENABLE_TEST_ROUTES: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().optional(),
  CLAMAV_HOST: z.string().optional(),
  CLAMAV_PORT: z.string().optional(),
  SITEMAP_CACHE_TTL_SECONDS: z.coerce.number().optional(),
  MATERIALS_CACHE_TTL_SECONDS: z.coerce.number().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const failureContext = {
    error: parsed.error.format(),
    databaseClient:
      typeof process.env.DATABASE_CLIENT === "string"
        ? process.env.DATABASE_CLIENT.toLowerCase()
        : undefined,
    databaseUrl: describeConnectionStringForLogs(process.env.DATABASE_URL),
    sessionDatabaseUrl: describeConnectionStringForLogs(process.env.SESSION_DB_URL),
  } as const;

  logger.error(failureContext, "Invalid or missing environment variables");
  process.exit(1);
}

const envRaw = parsed.data;

const siteUrl = resolveSiteUrl(envRaw.SITE_URL, envRaw.BASE_URL, DEFAULT_SITE_URL);

const resolvePositiveNumber = (value: number | undefined, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  return fallback;
};

const DEFAULT_SITEMAP_CACHE_TTL_SECONDS = 300;
const DEFAULT_MATERIALS_CACHE_TTL_SECONDS = 60;

const sitemapCacheTtlSeconds = resolvePositiveNumber(
  envRaw.SITEMAP_CACHE_TTL_SECONDS,
  DEFAULT_SITEMAP_CACHE_TTL_SECONDS,
);

const materialsCacheTtlSeconds = resolvePositiveNumber(
  envRaw.MATERIALS_CACHE_TTL_SECONDS,
  DEFAULT_MATERIALS_CACHE_TTL_SECONDS,
);

export const env = {
  ...envRaw,
  PORT: envRaw.PORT ?? 5000,
  ALLOWED_DOMAINS: envRaw.ALLOWED_DOMAINS
    ? envRaw.ALLOWED_DOMAINS.split(",").map((d) => d.trim()).filter(Boolean)
    : [],
  VERBOSE_LOGGING: envRaw.VERBOSE_LOGGING
    ? envRaw.VERBOSE_LOGGING === "true"
    : envRaw.NODE_ENV !== "production",
  SITE_URL: siteUrl,
  BASE_URL: siteUrl,
  SITEMAP_CACHE_TTL_SECONDS: sitemapCacheTtlSeconds,
  MATERIALS_CACHE_TTL_SECONDS: materialsCacheTtlSeconds,
};

export type Env = typeof env;

const primaryDatabaseSnapshot = describeConnectionStringForLogs(env.DATABASE_URL);
const sessionDatabaseSnapshot = env.SESSION_DB_URL && env.SESSION_DB_URL.trim().length > 0
  ? describeConnectionStringForLogs(env.SESSION_DB_URL)
  : { ...primaryDatabaseSnapshot, provided: false, reason: "fallbackToDatabaseUrl" };

logger.info(
  {
    databaseClient: env.DATABASE_CLIENT,
    databaseUrl: primaryDatabaseSnapshot,
    sessionDatabaseUrl: sessionDatabaseSnapshot,
    nodeEnv: env.NODE_ENV,
    verboseLogging: env.VERBOSE_LOGGING,
  },
  "Environment configuration resolved",
);
