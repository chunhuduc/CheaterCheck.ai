import { Module } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { JobsController } from "./jobs.controller";
import { CrawlWorker } from "./crawl.worker";

@Module({
  providers: [JobsService, CrawlWorker],
  controllers: [JobsController],
  exports: [JobsService],
})
export class JobsModule {}
