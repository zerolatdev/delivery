import type { HealthResponse } from "@delivery/shared";
import type { NetworkSnapshot } from "@/shared/lib/network/network-monitor";

export type ConnectionStatus = "checking" | "offline" | "unreachable" | "degraded" | "online";

export type HealthCheck = { kind: "pending" } | { kind: "ok"; health: HealthResponse } | { kind: "failed" };

/** Combina lo que dice el sistema sobre la red con el último resultado de /v1/health. */
export function deriveConnectionStatus(network: NetworkSnapshot | null, health: HealthCheck): ConnectionStatus {
  if (network?.connected === false) return "offline";
  switch (health.kind) {
    case "pending":
      return "checking";
    case "ok":
      return health.health.status === "ok" && health.health.database === "up" ? "online" : "degraded";
    case "failed":
      // Wifi sin internet (o portal cautivo): para el usuario es "sin conexión".
      return network?.internetReachable === false ? "offline" : "unreachable";
  }
}
