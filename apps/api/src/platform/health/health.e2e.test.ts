import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { healthResponseSchema } from "@delivery/shared";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, it, expect } from "vitest";
import { createTestDb } from "../../../test/test-db.js";
import { AppModule } from "../../app.module.js";
import { loadEnv } from "../config/env.js";
import { ENV } from "../config/config.module.js";
import { DB } from "../db/db.module.js";

const env = loadEnv({
  DATABASE_URL: "postgresql://u:p@localhost:5432/postgres",
  SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_x",
});

async function createApp(db: unknown): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ENV)
    .useValue(env)
    .overrideProvider(DB)
    .useValue(db)
    .compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("v1");
  await app.init();
  return app;
}

describe("GET /v1/health con la base arriba", () => {
  let app: INestApplication;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testDb = await createTestDb();
    closeDb = testDb.close;
    app = await createApp(testDb.db);
  });
  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it("responde ok con la base arriba", async () => {
    const res = await request(app.getHttpServer()).get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up", version: "0.1.0" });
    expect(healthResponseSchema.safeParse(res.body).success).toBe(true);
  });
});

describe("GET /v1/health con la base caída", () => {
  let app: INestApplication;

  afterEach(() => app.close());

  it("responde 503 sin detalles internos si la base falla", async () => {
    app = await createApp({
      execute: () => Promise.reject(new Error("password authentication failed for user postgres")),
    });
    const res = await request(app.getHttpServer()).get("/v1/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", database: "down", version: "0.1.0" });
    expect(JSON.stringify(res.body)).not.toContain("password");
  });

  it("responde 503 si la base no contesta a tiempo", async () => {
    app = await createApp({ execute: () => new Promise(() => {}) });
    const res = await request(app.getHttpServer()).get("/v1/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", database: "down", version: "0.1.0" });
  });
});
