import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AnalyticsService, VisitBatch } from './analytics.service';

@ApiTags('Analytics')
@Controller('anime-downloader/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('visits')
  @ApiOperation({
    summary: 'Ingest a batch of site visits from the app',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        visits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string', example: 'gogoanime.by' },
              count: { type: 'number', example: 3 },
            },
          },
        },
        device_id: { type: 'string', example: 'Xiaomi 23108RN04Y' },
        app_version: { type: 'string', example: '0.8.40' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Visits accepted' })
  async ingestVisits(@Body() body: VisitBatch) {
    return this.analyticsService.ingestBatch(body);
  }
}
