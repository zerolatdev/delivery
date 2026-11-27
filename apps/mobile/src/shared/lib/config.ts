import { z } from "zod";

const DEV_API_PORT = 3000;

/**
 * URL base del API. En desarrollo, si no se define EXPO_PUBLIC_API_URL, usa la IP
 * del Metro que sirvió el bundle: así el teléfono en la misma wifi llega al API local.
 */
export function resolveApiUrl(input: { apiUrl: string | undefined; devHostUri: string | undefined }): string {
  const fallback = input.devHostUri ? `http://${input.devHostUri.split(":")[0]}:${DEV_API_PORT}` : undefined;
  const parsed = z.url().safeParse(input.apiUrl ?? fallback);
  if (!parsed.success) {
    throw new Error("EXPO_PUBLIC_API_URL falta o no es una URL válida (p. ej. http://192.168.1.10:3000)");
  }
  return parsed.data.replace(/\/+$/, "");
}
