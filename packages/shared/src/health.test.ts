import { describe, it, expect } from "vitest";
import { healthResponseSchema } from "./health";

describe("healthResponseSchema", () => {
  it("acepta una respuesta válida", () => {
    expect(healthResponseSchema.parse({ status: "ok", database: "up", version: "0.1.0" }))
      .toEqual({ status: "ok", database: "up", version: "0.1.0" });
  });
  it("rechaza un estado de base de datos desconocido", () => {
    expect(healthResponseSchema.safeParse({ status: "ok", database: "maybe", version: "0.1.0" }).success).toBe(false);
  });
  it("rechaza HTML u objetos vacíos", () => {
    expect(healthResponseSchema.safeParse({}).success).toBe(false);
  });
});
