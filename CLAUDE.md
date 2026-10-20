# app-delivery

Plataforma de delivery multirrubro (arranca con restaurantes en Zumba, Ecuador). Monorepo pnpm + Turborepo, TypeScript en todo.

Documentos de referencia (leer antes de diseñar una funcionalidad nueva):
- `reports/Arquitectura patrones y SOLID.md` — arquitectura, patrones y SOLID (detalle y ejemplos)
- `reports/Arquitectura y stack app delivery.md` — stack y ruta de evolución
- `reports/Marco legal Ecuador delivery.md` — LOPDP, pagos, SRI
- `docs/superpowers/specs/` — diseños aprobados por módulo

## Reglas de arquitectura (obligatorias para toda funcionalidad nueva)

### Backend `apps/api` (NestJS, monolito modular)

1. Cada dominio es un módulo en `apps/api/src/modules/<modulo>/`. Antes de crear uno nuevo, verificar si la funcionalidad pertenece a uno existente.
2. **Cada módulo expone solo `index.ts`** (su fachada: `<Modulo>Api` + tipos públicos). Ningún módulo importa archivos internos de otro.
3. **Cada módulo es dueño de su schema de Postgres.** Nunca leer ni escribir tablas de otro schema; pedirlo por la fachada del otro módulo.
4. Consultas entre módulos: llamadas síncronas a la fachada. Reacciones a hechos (cuenta eliminada, pedido entregado): **eventos de dominio vía outbox transaccional**.
5. Estructura interna según la lógica del módulo:
   - **Con reglas de negocio** (identity, coverage, customers, catalog, orders, payments, dispatch): hexagonal.
     ```
     <modulo>/
     ├─ index.ts
     ├─ <modulo>.module.ts          bindings puerto → adaptador con tokens de inyección
     ├─ domain/                     entidades, value objects, errores, ports/ (interfaces)
     ├─ application/<caso-de-uso>/  un caso de uso por carpeta (command + handler)
     └─ infrastructure/             http/ (controllers), persistence/ (Drizzle schema + repos), adaptadores externos
     ```
   - **Casi CRUD** (legal, configuraciones): `controller` + `service` + `schema.ts`. Refactorizar a hexagonal solo si crece la lógica.
6. **Regla de dependencia:** `domain/` no importa `@nestjs/*`, `drizzle-orm`, Supabase ni `infrastructure/`. Las dependencias apuntan hacia el dominio.
7. Servicios externos (Supabase Auth, pasarelas de pago, mapas, push) siempre detrás de un **puerto** en `domain/ports/` con su **adaptador** en `infrastructure/`. Registrar con `{ provide: TOKEN, useClass: Adaptador }`.
8. Variaciones por rubro, método de pago o tarifa: **Strategy + registro** (p. ej. `VerticalRules`). Prohibido `if (vertical === 'pharmacy')` disperso.
9. Errores de negocio esperables: `Result<T, E>` de `shared-kernel`, mapeados a HTTP en un solo lugar. Excepciones solo para lo inesperado.
10. Escrituras que tocan varias tablas: una transacción (Drizzle `db.transaction`). Operaciones con un proveedor externo + BD: idempotencia y compensación.
11. Mutaciones que el móvil puede reintentar (registro, pedidos, pagos): **idempotentes** (`Idempotency-Key` o unicidad natural).
12. Estados del pedido: máquina de estados explícita con tabla de transiciones; cada transición escribe en `order_events`. Nunca actualizar `status` suelto.
13. Datos con valor de prueba legal (consentimientos, eventos de pedido, asientos del ledger): **solo inserción**.
14. `apps/api/src/shared-kernel/` solo para tipos de dominio usados por muchos módulos (`Result`, `Money`, `GeoPoint`, IDs con marca). `apps/api/src/platform/` para lo técnico transversal (db, auth guard, outbox, logger, config).

### Contratos compartidos `packages/shared`

- Sí: esquemas Zod de requests/responses, enums, constantes. Son la única fuente de verdad del contrato (DTOs de NestJS y OpenAPI salen de ahí).
- No: entidades de dominio, lógica de negocio ni código de NestJS.

### App móvil `apps/mobile` (Expo)

- `app/` (expo-router) solo rutas y layouts por rol: `(auth)`, `(customer)`, `(merchant)`, `(courier)`.
- Lógica en `src/features/<feature>/{api,components,model}`; lo común en `src/shared/{api-client,ui,lib}`. Una feature no importa internos de otra.
- Datos del servidor con TanStack Query; estado de UI local o Zustand. No copiar datos del servidor a un store global.
- Mutaciones críticas con `Idempotency-Key` generada en el cliente y reintento con backoff (señal irregular).
- Servicios nativos (ubicación, mapa, push) detrás de una interfaz propia.
- Permisos mínimos: ubicación solo en uso y solo en la pantalla que la necesita.

### SOLID y principios (criterio de revisión)

- **S:** controladores solo traducen HTTP ↔ comando; un servicio que importa más de tres repositorios o mezcla Supabase, Drizzle y reglas debe dividirse.
- **O:** nuevos rubros, pagos o reglas se agregan con nuevas clases, no modificando las existentes.
- **L:** toda implementación de un puerto cumple el contrato completo (sin `NotImplemented`); fakes y adaptadores reales pasan la misma suite de contrato.
- **I:** puertos mínimos según lo que usa el consumidor (p. ej. `CoverageChecker.isInsideServiceArea`).
- **D:** casos de uso dependen de puertos, nunca de SDKs concretos.
- KISS/YAGNI: sin Redis, colas, Temporal, Kafka, microservicios, CQRS con bases separadas ni Event Sourcing hasta que un disparador de volumen documentado lo pida.
- Evitar: repositorio genérico `BaseRepository<T>`, `ModuleRef.get()` / service locator, herencia de entidades por rubro, modelo anémico en módulos con reglas.

## Flujo para cada funcionalidad nueva

1. Identificar el módulo dueño (o justificar uno nuevo) y si es hexagonal o CRUD.
2. Definir el contrato en `packages/shared` (Zod).
3. Dominio y puertos → caso de uso → adaptadores e infraestructura → controlador.
4. Pruebas: unitarias del dominio (sin NestJS ni BD) e integración del caso de uso con PGlite + PostGIS.
5. Si la decisión cambia una regla de esta sección, registrarla como ADR en `docs/adr/` y actualizar este archivo.

## Reglas de git

- **No versionar** archivos `.md`, `docs/`, `reports/`, `research_notes/` ni nada de Claude (`.claude/`, `CLAUDE.local.md`, `graphify-out/`). **Única excepción: `CLAUDE.md`** de la raíz.
- Estas reglas ya están en `.gitignore`; no quitarlas ni usar `git add -f` sobre esos archivos. Si se crea un archivo nuevo de documentación o de Claude en otra ruta, agregarlo al `.gitignore`.

### Un PR por cada feat / fix / chore

- **Cada cambio va en su propia rama y su propio PR contra `main`.** Nunca commitear directo a `main`.
- **Rama:** siempre con prefijo `alexandervicente/` + tipo + descripción corta en kebab-case: `alexandervicente/<tipo>/<descripcion>`.
  Ejemplos: `alexandervicente/feat/crear-direccion`, `alexandervicente/fix/registro-duplicado`, `alexandervicente/chore/config-drizzle`, `alexandervicente/refactor/address-repository`.
- **Tipos permitidos** (Conventional Commits): `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `ci`, `revert`.
- **Commits:** solo `<tipo>: <descripción>`, **sin scope** entre paréntesis. Descripción corta, en imperativo, minúscula inicial, sin punto final.
  Ejemplos: `feat: add address creation`, `fix: label`, `chore: remove unused deps`, `refactor: extract coverage checker`.
  Incorrecto: `feat(customers): ...`, `Feat: ...`, `added address`.
- **Título del PR:** mismo formato que los commits (`feat: add address creation`).
- **Un PR = un solo propósito autocontenido.** No mezclar feature + refactor + formato. Los refactors van en su propio PR `refactor: ...`, antes del feature que los necesita.

### Tamaño del PR (para que sea revisable)

- **Objetivo: ~200 líneas cambiadas o menos. Límite blando: 400.** Más de 400 → dividir antes de abrir el PR. ~100 líneas es el tamaño ideal según la guía de Google; ~1000 es demasiado.
- **No más de ~10 archivos con lógica.** 200 líneas en un archivo es aceptable; repartidas en 50 archivos, no.
- No cuentan para el límite: lockfiles, migraciones y snapshots generados, archivos borrados enteros. Igual van en el mismo PR que el código que los origina.
- Las **pruebas van en el mismo PR** que la lógica que prueban (cuentan en el tamaño; no se separan para "achicar").
- Una API, puerto o tabla nueva va junto a su primer uso, no sola.
- Antes de abrir el PR, revisar `git diff --stat main...HEAD` y verificar el tamaño.

### Cómo dividir una funcionalidad grande

Planificar los PRs **antes** de escribir código, siguiendo las capas de la arquitectura:

1. **Por capas apiladas (stacked PRs):** cada PR parte de la rama del anterior y se mergea en orden. Ejemplo para "direcciones":
   1. `alexandervicente/feat/address-contract` → `feat: add address zod schemas`
   2. `alexandervicente/feat/address-domain` → `feat: add address domain and ports` (+ pruebas unitarias)
   3. `alexandervicente/feat/address-repository` → `feat: add address drizzle repository` (+ migración y pruebas de contrato)
   4. `alexandervicente/feat/address-endpoints` → `feat: add address use cases and endpoints` (+ pruebas de integración)
   5. `alexandervicente/feat/address-screen` → `feat: add addresses screen`
   Al mergear uno, rebasar los siguientes sobre `main`.
2. **Por slices verticales:** casos de uso independientes en PRs paralelos (crear dirección / marcar predeterminada / borrar).
3. **Por stubs:** mergear primero el contrato o un endpoint stub para que backend y app avancen en paralelo.
4. Cada PR debe dejar `main` **compilando y con pruebas en verde**. Si algo no está listo para el usuario, se oculta (ruta no expuesta en la app, flag) en vez de dejar código roto.

### Descripción del PR

Como los `.md` de docs no van a git, la descripción del PR es el registro del cambio:

```
## Qué
Una o dos frases.

## Por qué
Problema o requisito (enlace al spec/issue si existe).

## Cómo probar
Comandos o pasos manuales.

## Notas para el revisor
Decisiones, trade-offs, dónde empezar a leer. Si es parte de una pila: "PR 2/5, depende de #N".
```

- PRs con `gh pr create`. Si el PR supera 400 líneas por una razón inevitable (p. ej. migración inicial grande), explicarlo en "Notas para el revisor".

## Comandos

- `pnpm build` · `pnpm dev` · `pnpm lint` · `pnpm test` · `pnpm typecheck` (vía Turborepo)
