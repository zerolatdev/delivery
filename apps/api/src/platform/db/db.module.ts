import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import { createDbClient } from "./client.js";

export const DB = Symbol("DB");
const DB_CLIENT = Symbol("DB_CLIENT");

type DbClient = ReturnType<typeof createDbClient>;

@Global()
@Module({
  providers: [
    { provide: DB_CLIENT, inject: [ENV], useFactory: (env: Env) => createDbClient(env.DATABASE_URL) },
    { provide: DB, inject: [DB_CLIENT], useFactory: (client: DbClient) => client.db },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB_CLIENT) private readonly client: DbClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
