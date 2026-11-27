import { type HealthResponse, healthResponseSchema } from "@delivery/shared";
import { ApiError } from "@/shared/api-client/errors";
import type { HttpClient } from "@/shared/api-client/http";

const HEALTH_TIMEOUT_MS = 5_000;

/**
 * El API responde 503 con un HealthResponse cuando la base de datos está caída.
 * Ese cuerpo se devuelve como dato ("servicio con problemas"), no como error de conexión.
 */
export async function fetchHealth(http: HttpClient, signal?: AbortSignal): Promise<HealthResponse> {
  try {
    return await http.request("/v1/health", { schema: healthResponseSchema, timeoutMs: HEALTH_TIMEOUT_MS, signal });
  } catch (error) {
    if (error instanceof ApiError && error.kind === "http") {
      const degraded = healthResponseSchema.safeParse(error.body);
      if (degraded.success) return degraded.data;
    }
    throw error;
  }
}
