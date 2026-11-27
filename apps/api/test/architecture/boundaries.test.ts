import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { cruise, type ICruiseResult, type IConfiguration } from "dependency-cruiser";
import { beforeAll, describe, expect, it } from "vitest";

// Corre las reglas reales de .dependency-cruiser.cjs sobre un mini árbol `src/` estático.
// Si una regla deja de coincidir con algo (regex mal escrita), esta prueba falla en vez de
// dejar el lint en verde sin vigilar nada.
const require = createRequire(import.meta.url);
const config = require("../../.dependency-cruiser.cjs") as IConfiguration;
const fixturesDir = fileURLToPath(new URL("./fixtures", import.meta.url));

type Violation = { rule: string; from: string };

let violations: Violation[];

beforeAll(async () => {
  const { output } = await cruise(["src"], {
    ...config.options,
    ruleSet: { forbidden: config.forbidden },
    validate: true,
    baseDir: fixturesDir,
  });
  violations = (output as ICruiseResult).summary.violations.map((v) => ({
    rule: v.rule.name,
    from: v.from,
  }));
});

const firing = (rule: string): string[] =>
  violations
    .filter((v) => v.rule === rule)
    .map((v) => v.from)
    .sort();

describe("reglas de límites de arquitectura", () => {
  it("un módulo solo importa la fachada (index.ts) de otro", () => {
    expect(firing("solo-fachada-entre-modulos")).toEqual([
      "src/modules/a/application/bad-uses-internal.ts",
    ]);
  });

  it("el dominio no importa frameworks, infraestructura ni platform", () => {
    expect(firing("dominio-puro")).toEqual([
      "src/modules/a/domain/bad-imports-infra.ts",
      "src/modules/a/domain/bad-imports-nest.ts",
    ]);
  });

  it("shared-kernel no depende de platform, módulos ni paquetes npm", () => {
    expect(firing("shared-kernel-sin-dependencias")).toEqual([
      "src/shared-kernel/bad-imports-npm.ts",
      "src/shared-kernel/bad-imports-platform.ts",
    ]);
  });

  it("platform no conoce a los módulos", () => {
    expect(firing("platform-no-conoce-modulos")).toEqual(["src/platform/bad-knows-module.ts"]);
  });

  it("los módulos usan platform solo por su index.ts", () => {
    expect(firing("platform-solo-por-index")).toEqual([
      "src/modules/a/infrastructure/bad-uses-platform-internal.ts",
    ]);
  });

  it("no hay ciclos", () => {
    // depcruise reporta cada ciclo una vez, desde su primer archivo.
    expect(firing("sin-ciclos")).toEqual(["src/modules/b/domain/cycle-x.ts"]);
  });

  it("solo los archivos bad-* violan reglas", () => {
    const offenders = new Set(violations.map((v) => v.from.split("/").pop()));
    for (const file of offenders) expect(file).toMatch(/^(bad-|cycle-)/);
  });
});
