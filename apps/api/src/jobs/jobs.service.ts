import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { JobProgress, JobStatus } from "@cheatercheck/types";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(jobId: string): Promise<JobProgress | null> {
    const job = await this.prisma.crawlJob.findUnique({ where: { id: jobId } });
    if (!job) return null;
    return {
      jobId: job.id,
      status: job.status as JobStatus,
      progress: job.progress,
      currentStep: job.currentStep,
      profilesFound: job.profilesFound,
      signalsGenerated: job.signalsGenerated,
      errorMessage: job.errorMessage,
    };
  }
}
