import { Controller, Post, Body } from '@nestjs/common';
import { ReportsService, CreateReportInput } from './reports.service';

@Controller('anime-downloader/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async submit(@Body() body: CreateReportInput) {
    return this.reportsService.ingest(body);
  }
}
