import { Controller, Get, Query } from "@nestjs/common";
import { nanoid } from "nanoid";
import { RealtimeService } from "./realtime.service";

@Controller("realtime")
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  /** Browser calls this to get an Ably token request, then subscribes client-side. */
  @Get("token")
  async token(@Query("clientId") clientId?: string) {
    return this.realtime.createTokenRequest(clientId ?? `web_${nanoid(8)}`);
  }
}
