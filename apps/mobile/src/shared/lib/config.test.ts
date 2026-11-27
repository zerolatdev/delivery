import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./config";

describe("resolveApiUrl", () => {
  it("usa EXPO_PUBLIC_API_URL si está definida, sin barra final", () => {
    expect(resolveApiUrl({ apiUrl: "https://api.example.com/", devHostUri: "192.168.1.5:8081" })).toBe(
      "https://api.example.com",
    );
  });

  it("en desarrollo, sin variable, apunta al puerto 3000 del host de Metro", () => {
    expect(resolveApiUrl({ apiUrl: undefined, devHostUri: "192.168.1.5:8081" })).toBe("http://192.168.1.5:3000");
  });

  it("falla si no hay variable ni host de Metro", () => {
    expect(() => resolveApiUrl({ apiUrl: undefined, devHostUri: undefined })).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it("falla si la variable no es una URL", () => {
    expect(() => resolveApiUrl({ apiUrl: "no-es-url", devHostUri: undefined })).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});
