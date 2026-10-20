import { describe, it, expect } from "vitest";
import { loadEnv } from "./env.js";

const valid = {
  DATABASE_URL: "postgresql://u:p@host:5432/postgres",
  SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_x",
};

describe("loadEnv", () => {
  it("aplica valores por defecto", () => {
    expect(loadEnv(valid)).toMatchObject({ PORT: 3000, NODE_ENV: "development", APP_VERSION: "0.1.0" });
  });
  it("convierte PORT a número", () => {
    expect(loadEnv({ ...valid, PORT: "4000" }).PORT).toBe(4000);
  });
  it("nombra todas las variables faltantes", () => {
    expect(() => loadEnv({})).toThrow(
      "Variables de entorno inválidas o faltantes: DATABASE_URL, SUPABASE_URL, SUPABASE_SECRET_KEY",
    );
  });
  it("rechaza una DATABASE_URL que no es de Postgres", () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: "mysql://x" })).toThrow(/DATABASE_URL/);
  });
  it("no incluye el valor del secreto en el mensaje de error", () => {
    expect.assertions(1);
    try {
      loadEnv({ ...valid, SUPABASE_URL: "nope" });
    } catch (e) {
      expect(String(e)).not.toContain("sb_secret_x");
    }
  });
});
