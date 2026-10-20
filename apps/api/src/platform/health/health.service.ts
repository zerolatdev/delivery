import { Inject, Injectable } from "@nestjs/common";
import type { HealthResponse } from "@delivery/shared";
import { sql } from "drizzle-orm";
import { ENV } from "../config/config.module.js";
import type { Env } from "../config/env.js";
import type { Db } from "../db/client.js";
import { DB } from "../db/db.module.js";

const DB_TIMEOUT_MS = 2000;

@Injectable()
export class HealthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async check(): Promise<HealthResponse> {
    const version = this.env.APP_VERSION;
    const up = await this.pingDatabase();
    return up ? { status: "ok", database: "up", version } : { status: "degraded", database: "down", version };
  }

  private async pingDatabase(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), DB_TIMEOUT_MS);
    });
    // El error del driver puede traer usuario o host: se descarta, nunca se expone.
    const ping = this.db.execute(sql`select 1`).then(
      () => true,
      () => false,
    );
    try {
      return await Promise.race([ping, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
