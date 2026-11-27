import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { NetworkSnapshot } from "@/shared/lib/network/network-monitor";
import { useAppServices } from "@/shared/lib/services";
import { type ConnectionStatus, deriveConnectionStatus, type HealthCheck } from "../model/connection-status";
import { fetchHealth } from "./health";

const HEALTHY_INTERVAL_MS = 60_000;
const UNHEALTHY_INTERVAL_MS = 10_000;

export function useConnectionStatus(): ConnectionStatus {
  const { http, network } = useAppServices();
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);

  useEffect(() => {
    let active = true;
    void network.current().then((s) => active && setSnapshot(s));
    const unsubscribe = network.subscribe(setSnapshot);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [network]);

  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => fetchHealth(http, signal),
    // "always": probar aunque el sistema diga que no hay red (portales cautivos, señal
    // "conectada sin datos"). Sin reintentos: el intervalo ya vuelve a probar.
    networkMode: "always",
    retry: false,
    refetchInterval: (query) =>
      query.state.status === "success" && query.state.data?.status === "ok" ? HEALTHY_INTERVAL_MS : UNHEALTHY_INTERVAL_MS,
  });

  // Al volver la red, comprobar enseguida en vez de esperar al intervalo.
  const { refetch } = health;
  const connected = snapshot?.connected;
  useEffect(() => {
    if (connected) void refetch();
  }, [connected, refetch]);

  const check: HealthCheck =
    health.status === "success"
      ? { kind: "ok", health: health.data }
      : health.status === "error"
        ? { kind: "failed" }
        : { kind: "pending" };
  return deriveConnectionStatus(snapshot, check);
}
