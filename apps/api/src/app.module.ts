import { Module } from "@nestjs/common";
import { ConfigModule } from "./platform/config/config.module.js";
import { DbModule } from "./platform/db/db.module.js";
import { HealthModule } from "./platform/health/health.module.js";

@Module({
  imports: [ConfigModule, DbModule, HealthModule],
})
export class AppModule {}
