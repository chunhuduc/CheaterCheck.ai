import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
} from "@nestjs/common";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
} from "class-validator";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";
import type { CheckoutRequest } from "@cheatercheck/types";

class CheckoutDto implements CheckoutRequest {
  @IsString()
  @IsNotEmpty()
  reportId!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("checkout")
  async checkout(@Body() dto: CheckoutDto) {
    return this.payments.createCheckout(dto.reportId, dto.email);
  }

  @Post("webhook")
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    if (!req.rawBody) throw new BadRequestException("Missing raw body.");
    if (!signature) throw new BadRequestException("Missing stripe-signature.");
    return this.payments.handleWebhook(req.rawBody, signature);
  }
}
