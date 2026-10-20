import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // esbuild/oxc no emite metadata de decoradores; Nest la necesita para la inyección.
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // PGlite con PostGIS tarda varios segundos en arrancar en frío.
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
