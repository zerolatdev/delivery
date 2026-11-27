import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConnectionBanner } from "@/features/connection-status";
import { AppServicesProvider, createAppServices } from "@/shared/lib/services";

export default function RootLayout() {
  const [services] = useState(createAppServices);
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <AppServicesProvider services={services}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <View style={{ flex: 1 }}>
            <ConnectionBanner />
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </QueryClientProvider>
      </AppServicesProvider>
    </SafeAreaProvider>
  );
}
