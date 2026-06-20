import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeService } from "../realtime/realtime.service";
import type { JobProgress, JobStatus } from "@cheatercheck/types";

/**
 * Postgres-backed queue worker. Polls crawl_jobs for `pending` rows, claims one
 * atomically, runs the (simulated) crawl, writes signals, and streams progress
 * over Ably. This stands in for the old Python crawler + HarperDB job table.
 *
 * The crawl itself is stubbed: real profile scraping / face matching plugs in
 * at runCrawl(). The queue, claim, progress, and signal-write machinery is real.
 */
@Injectable()
export class CrawlWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CrawlWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly pollMs = Number(process.env.CRAWL_POLL_INTERVAL_MS ?? 1500);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  onModuleInit() {
    if (process.env.CRAWL_WORKER_DISABLED === "1") {
      this.logger.warn("Crawl worker disabled via CRAWL_WORKER_DISABLED.");
      return;
    }
    this.timer = setInterval(() => this.tick(), this.pollMs);
    this.logger.log(`Crawl worker polling every ${this.pollMs}ms.`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const job = await this.claimNextJob();
      if (job) await this.process(job.id, job.fullName, job.location, job.app);
    } catch (err) {
      this.logger.error(`Worker tick failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /** Atomically claim one pending job (status -> running) so concurrent workers don't collide. */
  private async claimNextJob() {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; full_name: string; location: string; app: string }>
    >`
      UPDATE crawl_jobs
      SET status = 'running', current_step = 'Starting crawl', updated_at = now()
      WHERE id = (
        SELECT id FROM crawl_jobs
        WHERE status = 'pending'
        ORDER BY priority DESC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id, full_name, location, app
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      fullName: row.full_name,
      location: row.location,
      app: row.app,
    };
  }

  private async process(
    jobId: string,
    fullName: string,
    location: string,
    app: string,
  ) {
    try {
      await this.emit(jobId, "running", 10, "Searching public profiles", 0, 0);
      await this.delay(800);

      const result = await this.runCrawl(fullName, location, app);
      await this.emit(
        jobId,
        "running",
        55,
        "Analyzing photo clusters",
        result.profilesFound,
        0,
      );
      await this.delay(800);

      // Persist any generated signals so the next lookup finds them.
      if (result.signals.length > 0) {
        await this.prisma.signal.createMany({ data: result.signals });
      }

      await this.emit(
        jobId,
        "running",
        90,
        "Scoring signals",
        result.profilesFound,
        result.signals.length,
      );
      await this.delay(500);

      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          profilesFound: result.profilesFound,
          signalsGenerated: result.signals.length,
        },
      });

      await this.emit(
        jobId,
        "completed",
        100,
        "Done",
        result.profilesFound,
        result.signals.length,
      );
      this.logger.log(
        `Job ${jobId} complete: ${result.signals.length} signals.`,
      );
    } catch (err) {
      const message = (err as Error).message;
      await this.prisma.crawlJob.update({
        where: { id: jobId },
        data: { status: "failed", errorMessage: message },
      });
      await this.emit(jobId, "failed", 0, "Failed", 0, 0, message);
      this.logger.error(`Job ${jobId} failed: ${message}`);
    }
  }

  /**
   * Stubbed crawl. Replace with real scraping + face matching.
   * Deterministically fabricates a signal ~half the time so the demo flow shows
   * both "found" and "clear" outcomes.
   */
  private async runCrawl(fullName: string, location: string, app: string) {
    const seed = `${fullName}${location}${app}`.length;
    const hit = seed % 2 === 1;
    const profilesFound = hit ? 1 + (seed % 3) : 0;
    const signals = hit
      ? [
          {
            fullName,
            location,
            app,
            signalType: "Photo overlap",
            status: "Review",
            detail:
              "Crawler found a similar photo cluster across multiple profiles.",
            confidence: "Medium",
            score: 40 + (seed % 30),
          },
        ]
      : [];
    return { profilesFound, signals };
  }

  private async emit(
    jobId: string,
    status: JobStatus,
    progress: number,
    currentStep: string,
    profilesFound: number,
    signalsGenerated: number,
    errorMessage: string | null = null,
  ) {
    await this.prisma.crawlJob.update({
      where: { id: jobId },
      data: { status, progress, currentStep, errorMessage },
    });
    const payload: JobProgress = {
      jobId,
      status,
      progress,
      currentStep,
      profilesFound,
      signalsGenerated,
      errorMessage,
    };
    await this.realtime.publishJobProgress(payload);
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
