import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Zumba</Text>
      <Text style={styles.subtitle}>Muy pronto podrás pedir desde aquí.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#FFFFFF" },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 16, color: "#4B5563", textAlign: "center" },
});
