import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { createTestDb } from "../../../test/test-db.js";
import type { Db } from "./client.js";
import { runMigrations } from "./migrate.js";

describe("migraciones", () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
  });
  afterAll(() => close());

  it("crea los schemas de los módulos", async () => {
    const rows = await db.execute<{ schema_name: string }>(sql`select schema_name from information_schema.schemata
      where schema_name in ('identity','coverage','customers') order by schema_name`);
    expect(rows.rows.map((r: { schema_name: string }) => r.schema_name)).toEqual(["coverage", "customers", "identity"]);
  });
  it("instala PostGIS en el schema extensions", async () => {
    const rows = await db.execute<{ nspname: string }>(sql`select n.nspname from pg_extension e
      join pg_namespace n on n.oid = e.extnamespace where e.extname = 'postgis'`);
    expect(rows.rows[0]?.nspname).toBe("extensions");
  });
  it("puede volver a correrse sin error", async () => {
    await expect(runMigrations(db)).resolves.toBeUndefined();
  });
});
