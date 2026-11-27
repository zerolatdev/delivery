import type { HealthResponse } from "@delivery/shared";
import { describe, expect, it } from "vitest";
import type { NetworkSnapshot } from "@/shared/lib/network/network-monitor";
import { type ConnectionStatus, deriveConnectionStatus, type HealthCheck } from "./connection-status";

const ok: HealthResponse = { status: "ok", database: "up", version: "0.1.0" };
const dbDown: HealthResponse = { status: "degraded", database: "down", version: "0.1.0" };

const online: NetworkSnapshot = { connected: true, internetReachable: true };
const noInternet: NetworkSnapshot = { connected: true, internetReachable: false };
const disconnected: NetworkSnapshot = { connected: false, internetReachable: false };

const cases: [string, NetworkSnapshot | null, HealthCheck, ConnectionStatus][] = [
  ["sin dato de red ni de health", null, { kind: "pending" }, "checking"],
  ["con red y health pendiente", online, { kind: "pending" }, "checking"],
  ["sin red, aunque health siga pendiente", disconnected, { kind: "pending" }, "offline"],
  ["sin red, aunque quede un health ok viejo", disconnected, { kind: "ok", health: ok }, "offline"],
  ["con red y health ok", online, { kind: "ok", health: ok }, "online"],
  ["red aún desconocida y health ok", null, { kind: "ok", health: ok }, "online"],
  ["health responde con la base de datos caída", online, { kind: "ok", health: dbDown }, "degraded"],
  ["con red y health falla", online, { kind: "failed" }, "unreachable"],
  ["red conectada sin internet y health falla", noInternet, { kind: "failed" }, "offline"],
  ["red conectada sin internet pero el API local responde", noInternet, { kind: "ok", health: ok }, "online"],
];

describe("deriveConnectionStatus", () => {
  it.each(cases)("%s", (_name, network, health, expected) => {
    expect(deriveConnectionStatus(network, health)).toBe(expected);
  });
});
