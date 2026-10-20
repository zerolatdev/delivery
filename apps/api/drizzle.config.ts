import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/platform/db/schemas.ts",
  out: "./drizzle",
  schemaFilter: ["identity", "coverage", "customers"],
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
