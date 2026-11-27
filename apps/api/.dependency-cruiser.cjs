// Límites de arquitectura del API (ver CLAUDE.md, reglas 2, 3, 6 y 14).
// test/architecture/boundaries.test.ts comprueba que cada regla dispara sobre fixtures.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "solo-fachada-entre-modulos",
      comment: "Un módulo solo importa el index.ts de otro módulo, nunca sus archivos internos.",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/[^/]+/(?!index\\.ts$)", pathNot: "^src/modules/$1/" },
    },
    {
      name: "dominio-puro",
      comment: "domain/ no importa application, infrastructure, platform ni frameworks/SDKs.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/domain/" },
      to: {
        path: [
          "^src/modules/[^/]+/(application|infrastructure)/",
          "^src/platform/",
          "node_modules/(@nestjs|drizzle-orm|@supabase|postgres|@electric-sql)/",
        ],
      },
    },
    {
      name: "shared-kernel-sin-dependencias",
      comment: "shared-kernel es TypeScript puro: sin platform, módulos ni paquetes npm.",
      severity: "error",
      from: { path: "^src/shared-kernel/" },
      to: { path: ["^src/(platform|modules)/", "node_modules/"] },
    },
    {
      name: "platform-no-conoce-modulos",
      comment: "platform es transversal; la composición con módulos ocurre en app.module.ts.",
      severity: "error",
      from: { path: "^src/platform/" },
      to: { path: "^src/modules/" },
    },
    {
      name: "platform-solo-por-index",
      comment: "Los módulos usan cada subcarpeta de platform solo por su index.ts.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/platform/[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "sin-ciclos",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.ts$" },
    tsPreCompilationDeps: true,
  },
};
