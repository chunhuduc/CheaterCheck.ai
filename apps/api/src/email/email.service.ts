import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

/**
 * Resend wrapper. No-ops when RESEND_API_KEY is unset so local dev works
 * without an account.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    this.resend = key ? new Resend(key) : null;
    this.from = process.env.RESEND_FROM ?? "CheaterCheck <reports@cheatercheck.ai>";
    if (!this.resend) {
      this.logger.warn("RESEND_API_KEY unset; emails will be logged, not sent.");
    }
  }

  async sendReportUnlocked(to: string, reportId: string, webOrigin: string) {
    const url = `${webOrigin}/report?id=${reportId}`;
    const subject = "Your CheaterCheck report is unlocked";
    const html = `<p>Your scan report is ready.</p><p><a href="${url}">View your report</a></p>`;
    return this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[email:dev] to=${to} subject="${subject}"`);
      return { id: "dev-noop" };
    }
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
    if (error) {
      this.logger.error(`Resend error: ${error.message}`);
      throw new Error(error.message);
    }
    return data;
  }
}
