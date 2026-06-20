import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
} from "@nestjs/common";
import { LookupService } from "./lookup.service";
import { LookupDto } from "./dto";

@Controller()
export class LookupController {
  constructor(private readonly lookup: LookupService) {}

  @Post("lookup")
  async runLookup(@Body() dto: LookupDto) {
    return this.lookup.lookup(dto);
  }

  @Get("reports/:id")
  async getReport(@Param("id") id: string) {
    const report = await this.lookup.getReport(id);
    if (!report) throw new NotFoundException("Report not found");
    return report;
  }
}
