import type { ZodType } from "zod";
import { ApiError } from "./errors";

const DEFAULT_TIMEOUT_MS = 15_000;

export interface RequestOptions<T> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  schema: ZodType<T>;
  timeoutMs?: number;
  /** Cancelación externa (TanStack Query pasa la suya). */
  signal?: AbortSignal;
}

export interface HttpClient {
  request<T>(path: string, options: RequestOptions<T>): Promise<T>;
}

export function createHttpClient(deps: { baseUrl: string; fetch: typeof fetch }): HttpClient {
  return {
    async request<T>(path: string, options: RequestOptions<T>): Promise<T> {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      const forwardAbort = () => controller.abort();
      options.signal?.addEventListener("abort", forwardAbort);

      let response: Response;
      try {
        response = await deps.fetch(`${deps.baseUrl}${path}`, {
          method: options.method ?? "GET",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
        });
      } catch (error) {
        if (timedOut) throw new ApiError("timeout", null, `Sin respuesta de ${path}`);
        if (options.signal?.aborted) throw error;
        throw new ApiError("network", null, `No se pudo conectar con ${path}`);
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener("abort", forwardAbort);
      }

      const body = parseJson(await response.text());
      if (!response.ok) {
        throw new ApiError("http", response.status, `${path} respondió ${response.status}`, body);
      }
      const parsed = options.schema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError("contract", response.status, `${path} no cumple el contrato`, body);
      }
      return parsed.data;
    },
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
