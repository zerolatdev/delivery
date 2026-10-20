import { drizzle } from "drizzle-orm/postgres-js";
import type { PgDatabase } from "drizzle-orm/pg-core";
import postgres from "postgres";

// Tipo común a los drivers postgres-js (servidor) y PGlite (pruebas).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, any>;

export function createDbClient(url: string): { db: Db; close(): Promise<void> } {
  // prepare: false lo exige el pooler de Supabase en modo transacción.
  const client = postgres(url, { prepare: false });
  return { db: drizzle({ client }), close: () => client.end() };
}
