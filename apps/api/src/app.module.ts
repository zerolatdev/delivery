import { Module } from "@nestjs/common";
import { ConfigModule } from "./platform/config/config.module.js";

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
