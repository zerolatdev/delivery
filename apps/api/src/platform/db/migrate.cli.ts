import { loadEnv } from "../config/env.js";
import { createDbClient } from "./client.js";
import { runMigrations } from "./migrate.js";

const { db, close } = createDbClient(loadEnv(process.env).DATABASE_URL);
try {
  await runMigrations(db);
  console.log("Migraciones aplicadas.");
} finally {
  await close();
}
