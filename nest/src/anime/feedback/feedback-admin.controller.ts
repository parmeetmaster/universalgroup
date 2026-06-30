import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { AdminGuard } from '../admin/admin.guard';
import { FeedbackService } from './feedback.service';

@ApiTags('Feedback (Admin)')
@Controller('anime-downloader/admin/feedback')
@UseGuards(AdminGuard)
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @ApiOperation({ summary: 'List all feedback entries (newest first)' })
  @ApiHeader({
    name: 'X-Admin-Token',
    required: true,
    description: 'Admin authentication token',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of feedback entries',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              rating: { type: 'number' },
              problemTypes: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              deviceModel: { type: 'string', nullable: true },
              appVersion: { type: 'string', nullable: true },
              androidVersion: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.feedbackService.list({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
