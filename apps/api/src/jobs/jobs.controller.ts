import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  /** Fallback for clients that poll instead of subscribing to Ably. */
  @Get(":id")
  async getJob(@Param("id") id: string) {
    const progress = await this.jobs.getProgress(id);
    if (!progress) throw new NotFoundException("Job not found");
    return progress;
  }
}
