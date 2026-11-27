import * as Network from "expo-network";
import type { NetworkMonitor, NetworkSnapshot } from "./network-monitor";

function toSnapshot(state: Network.NetworkState): NetworkSnapshot {
  return {
    // Si el sistema no lo informa, no se asume "sin red": decide /health.
    connected: state.isConnected !== false,
    internetReachable: state.isInternetReachable ?? null,
  };
}

export function createExpoNetworkMonitor(): NetworkMonitor {
  return {
    current: async () => toSnapshot(await Network.getNetworkStateAsync()),
    subscribe(listener) {
      const subscription = Network.addNetworkStateListener((state) => listener(toSnapshot(state)));
      return () => subscription.remove();
    },
  };
}
