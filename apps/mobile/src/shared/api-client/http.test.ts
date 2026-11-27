import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError } from "./errors";
import { createHttpClient } from "./http";

const schema = z.object({ value: z.number() });

function clientWith(fetchImpl: typeof fetch) {
  return createHttpClient({ baseUrl: "http://api.test", fetch: fetchImpl });
}

function respond(status: number, body: string): typeof fetch {
  return async () => new Response(body, { status, headers: { "Content-Type": "application/json" } });
}

async function errorOf(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe("createHttpClient", () => {
  it("devuelve el cuerpo validado por el schema", async () => {
    const http = clientWith(respond(200, '{"value":1}'));
    await expect(http.request("/x", { schema })).resolves.toEqual({ value: 1 });
  });

  it("une baseUrl y path", async () => {
    let url = "";
    const http = clientWith(async (input) => {
      url = String(input);
      return new Response('{"value":1}', { status: 200 });
    });
    await http.request("/v1/health", { schema });
    expect(url).toBe("http://api.test/v1/health");
  });

  it("marca como contract un 200 que no cumple el schema", async () => {
    const error = await errorOf(clientWith(respond(200, '{"value":"uno"}')).request("/x", { schema }));
    expect(error.kind).toBe("contract");
    expect(error.status).toBe(200);
  });

  it("marca como contract un 200 con JSON inválido", async () => {
    const error = await errorOf(clientWith(respond(200, "<html>")).request("/x", { schema }));
    expect(error.kind).toBe("contract");
  });

  it("marca como http un 503 y conserva el cuerpo", async () => {
    const error = await errorOf(clientWith(respond(503, '{"value":2}')).request("/x", { schema }));
    expect(error.kind).toBe("http");
    expect(error.status).toBe(503);
    expect(error.body).toEqual({ value: 2 });
  });

  it("marca como network un fallo de fetch", async () => {
    const http = clientWith(async () => {
      throw new TypeError("Network request failed");
    });
    const error = await errorOf(http.request("/x", { schema }));
    expect(error.kind).toBe("network");
    expect(error.status).toBeNull();
  });

  it("marca como timeout si el servidor no responde a tiempo", async () => {
    const http = clientWith(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const error = await errorOf(http.request("/x", { schema, timeoutMs: 10 }));
    expect(error.kind).toBe("timeout");
  });

  it("propaga la cancelación externa sin convertirla en ApiError", async () => {
    const controller = new AbortController();
    const http = clientWith(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const pending = http.request("/x", { schema, signal: controller.signal });
    controller.abort();
    const error = await pending.then(() => null, (e: unknown) => e);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
