import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";
import * as schema from "../shared/schema.js";
import { describeConnectionStringForLogs, env } from "./config.js";
import logger from "./logger.js";

const createNeonConnection = () => {
  neonConfig.webSocketConstructor = ws;

  const logContext = {
    databaseClient: env.DATABASE_CLIENT,
    databaseUrl: describeConnectionStringForLogs(env.DATABASE_URL),
  } as const;

  try {
    const pool = new NeonPool({ connectionString: env.DATABASE_URL });

    logger.info(logContext, "Created Neon connection pool");

    return {
      pool,
      db: neonDrizzle({ client: pool, schema }),
    } as const;
  } catch (error) {
    logger.error({ ...logContext, error }, "Failed to create Neon connection pool");
    throw error;
  }
};

const createPgConnection = () => {
  const logContext = {
    databaseClient: env.DATABASE_CLIENT,
    databaseUrl: describeConnectionStringForLogs(env.DATABASE_URL),
  } as const;

  try {
    const pool = new PgPool({ connectionString: env.DATABASE_URL });

    logger.info(logContext, "Created Postgres connection pool");

    return {
      pool,
      db: pgDrizzle(pool, { schema }),
    } as const;
  } catch (error) {
    logger.error({ ...logContext, error }, "Failed to create Postgres connection pool");
    throw error;
  }
};

const connection =
  env.DATABASE_CLIENT === "neon" ? createNeonConnection() : createPgConnection();

export const pool = connection.pool;
export const db = connection.db;
