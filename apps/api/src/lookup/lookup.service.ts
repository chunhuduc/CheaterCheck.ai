import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  LookupResponse,
  SignalCard,
  Confidence,
  DatingApp,
  SignalStatus,
} from "@cheatercheck/types";
import { LookupDto } from "./dto";

@Injectable()
export class LookupService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(dto: LookupDto): Promise<LookupResponse> {
    const fullName = dto.fullName.trim();
    const location = (dto.location ?? "").trim();
    const app = dto.app;

    const signals = await this.prisma.signal.findMany({
      where: {
        fullName,
        app,
        ...(location ? { location } : {}),
      },
      take: 5,
      orderBy: { score: "desc" },
    });

    const found = signals.length > 0;

    // On a miss, enqueue a crawl job so the worker can try to populate signals.
    let jobId: string | null = null;
    if (!found) {
      const job = await this.prisma.crawlJob.create({
        data: { fullName, location, app },
      });
      jobId = job.id;
    }

    const matches: SignalCard[] = found
      ? signals.map((s) => ({
          label: s.signalType,
          detail: s.detail,
          status: (s.status as SignalStatus) ?? "Review",
        }))
      : [
          {
            label: "No signals found",
            detail: jobId
              ? "Crawl job created. Results will appear here as they come in."
              : "No matching records in the current dataset.",
            status: jobId ? "Crawling" : "Clear",
          },
        ];

    const confidence: Confidence = found
      ? (signals[0].confidence as Confidence)
      : "Low";
    const score = found
      ? Math.min(80, signals[0].score)
      : 12;

    const nextSteps = found
      ? [
          "Verify with a second photo or handle.",
          "Use the safety checklist before meeting.",
        ]
      : jobId
        ? [
            "We are scanning now. Watch the live progress above.",
            "Results update automatically when the crawl finishes.",
          ]
        : [
            "Try another photo or spelling variation.",
            "Use the safety checklist before meeting.",
          ];

    const report = await this.prisma.report.create({
      data: {
        fullName,
        location,
        app,
        found,
        confidence,
        score,
        matches: matches as unknown as object,
        nextSteps: nextSteps as unknown as object,
        jobId,
      },
    });

    return this.toResponse(report.id, {
      found,
      jobId,
      confidence,
      score,
      profile: { fullName, location, app: app as DatingApp },
      matches,
      nextSteps,
      unlocked: false,
    });
  }

  async getReport(id: string): Promise<LookupResponse | null> {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) return null;
    return this.toResponse(report.id, {
      found: report.found,
      jobId: report.jobId,
      confidence: report.confidence as Confidence,
      score: report.score,
      profile: {
        fullName: report.fullName,
        location: report.location,
        app: report.app as DatingApp,
      },
      matches: report.matches as unknown as SignalCard[],
      nextSteps: report.nextSteps as unknown as string[],
      unlocked: report.unlocked,
    });
  }

  private toResponse(
    reportId: string,
    body: Omit<LookupResponse, "reportId">,
  ): LookupResponse {
    return { reportId, ...body };
  }
}
