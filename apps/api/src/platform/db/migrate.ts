import { fileURLToPath } from "node:url";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { Db } from "./client.js";

// src/ y dist/ están al mismo nivel, así que la ruta sirve en desarrollo y compilado.
export const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../../drizzle", import.meta.url));

export async function runMigrations(db: Db): Promise<void> {
  // Los migradores de postgres-js y PGlite son idénticos (dialect.migrate sobre la sesión),
  // así que uno solo sirve para ambos drivers.
  await migrate(db as PostgresJsDatabase, { migrationsFolder: MIGRATIONS_FOLDER });
}
