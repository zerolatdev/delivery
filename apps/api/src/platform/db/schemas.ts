import { pgSchema } from "drizzle-orm/pg-core";

// Un schema de Postgres por módulo; ningún módulo toca las tablas de otro.
export const identitySchema = pgSchema("identity");
export const coverageSchema = pgSchema("coverage");
export const customersSchema = pgSchema("customers");
