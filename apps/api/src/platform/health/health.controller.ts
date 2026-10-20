import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import type { HealthResponse } from "@delivery/shared";
import { HealthService } from "./health.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async get(): Promise<HealthResponse> {
    const result = await this.health.check();
    if (result.database === "down") throw new ServiceUnavailableException(result);
    return result;
  }
}
