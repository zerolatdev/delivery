import Constants from "expo-constants";
import { createContext, type ReactNode, useContext } from "react";
import { createHttpClient, type HttpClient } from "@/shared/api-client/http";
import { resolveApiUrl } from "./config";
import { createExpoNetworkMonitor } from "./network/expo-network-monitor";
import type { NetworkMonitor } from "./network/network-monitor";

/** Adaptadores que usan las features. Las pruebas o previews pueden inyectar fakes. */
export interface AppServices {
  http: HttpClient;
  network: NetworkMonitor;
}

export function createAppServices(): AppServices {
  const baseUrl = resolveApiUrl({
    // Acceso literal: Expo reemplaza process.env.EXPO_PUBLIC_* al empaquetar.
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    devHostUri: __DEV__ ? Constants.expoConfig?.hostUri : undefined,
  });
  return {
    http: createHttpClient({ baseUrl, fetch: (input, init) => fetch(input, init) }),
    network: createExpoNetworkMonitor(),
  };
}

const AppServicesContext = createContext<AppServices | null>(null);

export function AppServicesProvider({ services, children }: { services: AppServices; children: ReactNode }) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);
  if (!services) throw new Error("useAppServices fuera de AppServicesProvider");
  return services;
}
