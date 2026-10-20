import { PGlite } from "@electric-sql/pglite";
import { postgis } from "@electric-sql/pglite-postgis";
import { drizzle } from "drizzle-orm/pglite";
import type { Db } from "../src/platform/db/client.js";
import { runMigrations } from "../src/platform/db/migrate.js";

export async function createTestDb(): Promise<{ db: Db; close(): Promise<void> }> {
  const client = await PGlite.create({ extensions: { postgis } });
  const db = drizzle({ client });
  await runMigrations(db);
  return { db, close: () => client.close() };
}
