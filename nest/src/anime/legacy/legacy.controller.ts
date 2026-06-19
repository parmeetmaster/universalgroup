import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
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
  async submitLegacy(@Body() body: CreateReportInput, @Req() req: Request) {
    // Capture the reporter's location: prefer what the app sends (IP-geo
    // "Region, Country"), and fall back to the device-country / IP from headers
    // so a report always carries some location signal.
    const headerCountry = (req.headers['x-device-country'] as string) || '';
    const headerLocale = (req.headers['x-device-locale'] as string) || '';
    const fwd = (req.headers['x-forwarded-for'] as string) || '';
    const ip = fwd.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    const fallback = [headerCountry || headerLocale, ip]
      .filter(Boolean)
      .join(' | ');
    const merged: CreateReportInput = {
      ...(body || {}),
      location: (body?.location || fallback || '').trim() || undefined,
    };
    const row = await this.reports.ingest(merged);
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
