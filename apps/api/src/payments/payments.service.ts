import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import type { CheckoutResponse } from "@cheatercheck/types";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY;
    this.stripe = key ? new Stripe(key) : null;
    if (!this.stripe) {
      this.logger.warn("STRIPE_SECRET_KEY unset; checkout disabled.");
    }
  }

  async createCheckout(
    reportId: string,
    email?: string,
  ): Promise<CheckoutResponse> {
    if (!this.stripe) {
      throw new BadRequestException("Payments not configured.");
    }
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new BadRequestException("Report not found.");
    if (report.unlocked) {
      // Already paid; send them straight to the report.
      return { url: this.successUrl(reportId) };
    }

    const price = process.env.STRIPE_PRICE_SINGLE;
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: price
        ? [{ price, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                product_data: { name: "CheaterCheck single report" },
                unit_amount: 1800,
              },
              quantity: 1,
            },
          ],
      customer_email: email,
      metadata: { reportId },
      success_url: this.successUrl(reportId),
      cancel_url: `${this.webOrigin()}/report?id=${reportId}&canceled=1`,
    });

    if (!session.url) throw new BadRequestException("Could not start checkout.");
    return { url: session.url };
  }

  /** Verifies the Stripe signature, unlocks the report, emails the receipt link. */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) throw new BadRequestException("Payments not configured.");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException("Webhook secret not set.");

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature failed: ${(err as Error).message}`,
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const reportId = session.metadata?.reportId;
      if (reportId) {
        const email =
          session.customer_details?.email ?? session.customer_email ?? null;
        await this.prisma.report.update({
          where: { id: reportId },
          data: { unlocked: true, email },
        });
        if (email) {
          await this.email.sendReportUnlocked(email, reportId, this.webOrigin());
        }
        this.logger.log(`Report ${reportId} unlocked via Stripe.`);
      }
    }

    return { received: true };
  }

  private successUrl(reportId: string) {
    const base =
      process.env.REPORT_UNLOCK_SUCCESS_URL ??
      `${this.webOrigin()}/report`;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}id=${reportId}`;
  }

  private webOrigin() {
    return (process.env.WEB_ORIGIN?.split(",")[0] ?? "http://localhost:3000").trim();
  }
}
