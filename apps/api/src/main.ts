import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { EnvValidationError, loadEnv } from "./platform/config/env.js";

async function bootstrap() {
  let port: number;
  try {
    port = loadEnv(process.env).PORT;
  } catch (error) {
    if (!(error instanceof EnvValidationError)) throw error;
    console.error(error.message);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.enableShutdownHooks();
  // 0.0.0.0 para que el celular llegue por la red wifi local.
  await app.listen(port, "0.0.0.0");
}

await bootstrap();
