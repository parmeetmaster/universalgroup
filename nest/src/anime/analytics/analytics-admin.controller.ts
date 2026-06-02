import { Controller, Get, Delete, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminGuard } from '../admin/admin.guard';

@ApiTags('Analytics (Admin)')
@Controller('anime-downloader/admin/analytics')
@UseGuards(AdminGuard)
export class AnalyticsAdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('top-sites')
  @ApiOperation({ summary: 'Get top visited sites aggregated by domain' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Top sites list' })
  async topSites(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const items = await this.analyticsService.topSites({
      days: days ? parseInt(days, 10) : 30,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return { items, count: items.length };
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily visit statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Daily stats' })
  async dailyStats(@Query('days') days?: string) {
    return this.analyticsService.dailyStats({
      days: days ? parseInt(days, 10) : 14,
    });
  }

  @Delete('cleanup')
  @ApiOperation({ summary: 'Delete visit data older than N days' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Deleted count' })
  async cleanup(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 90;
    const deleted = await this.analyticsService.deleteOlderThan(d);
    return { deleted };
  }
}
