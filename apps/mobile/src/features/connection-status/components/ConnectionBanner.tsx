import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConnectionStatus } from "../api/use-connection-status";
import type { ConnectionStatus } from "../model/connection-status";

const BANNERS: Partial<Record<ConnectionStatus, { message: string; background: string }>> = {
  offline: { message: "Sin conexión. Revisa tu señal o tu wifi.", background: "#4B5563" },
  unreachable: { message: "No podemos llegar al servidor. Reintentando…", background: "#B45309" },
  degraded: { message: "El servicio tiene problemas. Algunas funciones pueden fallar.", background: "#B45309" },
};

export function ConnectionBanner() {
  const status = useConnectionStatus();
  const insets = useSafeAreaInsets();
  const banner = BANNERS[status];
  if (!banner) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: banner.background, paddingTop: insets.top + 8 }]}
    >
      <Text style={styles.text}>{banner.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingHorizontal: 16, paddingBottom: 8 },
  text: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", textAlign: "center" },
});
