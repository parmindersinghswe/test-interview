import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as path from "path";

// Force load .env.local
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

if (!process.env.DATABASE_URL) {
  console.log("Available ENV vars:", process.env); // Optional debug
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
