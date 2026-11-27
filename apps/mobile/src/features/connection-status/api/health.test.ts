import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api-client/errors";
import { createHttpClient } from "@/shared/api-client/http";
import { fetchHealth } from "./health";

function httpResponding(status: number, body: string) {
  return createHttpClient({ baseUrl: "http://api.test", fetch: async () => new Response(body, { status }) });
}

describe("fetchHealth", () => {
  it("devuelve el estado cuando el API responde 200", async () => {
    const http = httpResponding(200, '{"status":"ok","database":"up","version":"0.1.0"}');
    await expect(fetchHealth(http)).resolves.toEqual({ status: "ok", database: "up", version: "0.1.0" });
  });

  it("devuelve el estado degradado que viene en el cuerpo de un 503", async () => {
    const http = httpResponding(503, '{"status":"degraded","database":"down","version":"0.1.0"}');
    await expect(fetchHealth(http)).resolves.toMatchObject({ status: "degraded", database: "down" });
  });

  it("falla si el 503 no trae un HealthResponse (p. ej. un proxy)", async () => {
    const http = httpResponding(503, "<html>Bad gateway</html>");
    await expect(fetchHealth(http)).rejects.toBeInstanceOf(ApiError);
  });
});
