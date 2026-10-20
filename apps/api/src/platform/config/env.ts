import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//),
  SUPABASE_URL: z.url({ protocol: /^https$/ }),
  SUPABASE_SECRET_KEY: z.string().min(1),
  APP_VERSION: z.string().min(1).default("0.1.0"),
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(readonly keys: string[]) {
    // Solo nombres de variables: nunca valores, que pueden ser secretos.
    super(`Variables de entorno inválidas o faltantes: ${keys.join(", ")}`);
    this.name = "EnvValidationError";
  }
}

export function loadEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const invalid = new Set(result.error.issues.map((issue) => String(issue.path[0])));
  const keys = Object.keys(envSchema.shape).filter((key) => invalid.has(key));
  throw new EnvValidationError(keys);
}
