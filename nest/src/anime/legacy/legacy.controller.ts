import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { KvService } from '../kv/kv.service';
import {
  ReportsService,
  type CreateReportInput,
} from '../reports/reports.service';

@Controller('anime-downloader/users')
export class LegacyController {
  constructor(
    private readonly reports: ReportsService,
    private readonly kv: KvService,
  ) {}

  @Post('submitErrorReportAnimeDownloader')
  @HttpCode(200)
  async submitLegacy(@Body() body: CreateReportInput) {
    const row = await this.reports.ingest(body || {});
    return { statusCode: 200, message: 'ok', data: { id: row.id } };
  }

  @Get('fetchStaticDataForAnimeDownloader')
  async fetchStaticData() {
    try {
      const entry = await this.kv.get('app_config');
      if (!entry) return { statusCode: 200, message: 'ok', data: null };
      const raw =
        typeof entry.value === 'string'
          ? JSON.parse(entry.value)
          : entry.value;
      return { statusCode: 200, message: 'ok', data: raw };
    } catch {
      return {
        statusCode: 200,
        message: 'ok',
        data: null,
      };
    }
  }
}
