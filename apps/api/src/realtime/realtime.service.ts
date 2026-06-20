import { Injectable, Logger } from "@nestjs/common";
import Ably from "ably";
import { ABLY_JOB_CHANNEL, JobProgress } from "@cheatercheck/types";

/**
 * Wraps Ably. Publishes crawl progress so the web client gets live updates
 * without polling. If ABLY_API_KEY is unset we no-op (local dev fallback).
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly client: Ably.Rest | null;

  constructor() {
    const key = process.env.ABLY_API_KEY;
    this.client = key ? new Ably.Rest(key) : null;
    if (!this.client) {
      this.logger.warn("ABLY_API_KEY unset; realtime publishing disabled.");
    }
  }

  get enabled() {
    return this.client !== null;
  }

  async publishJobProgress(progress: JobProgress): Promise<void> {
    if (!this.client) return;
    try {
      const channel = this.client.channels.get(
        ABLY_JOB_CHANNEL(progress.jobId),
      );
      await channel.publish("progress", progress);
    } catch (err) {
      this.logger.error(`Ably publish failed: ${(err as Error).message}`);
    }
  }

  /** Issues a short-lived token request so the browser can subscribe safely. */
  async createTokenRequest(clientId: string) {
    if (!this.client) {
      throw new Error("Realtime not configured");
    }
    return this.client.auth.createTokenRequest({ clientId });
  }
}
