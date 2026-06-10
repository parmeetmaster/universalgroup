import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackAdminGuard } from './feedback-admin.guard';
import { FeedbackService } from './feedback.service';

/**
 * Common, cross-app feedback/issue API. Any app submits to POST /api/feedback with
 * an X-App-Name header; the listing/management endpoints are admin-only.
 */
@ApiTags('Common - Feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit feedback / an issue report from any app',
    description:
      'Flexible endpoint — only `message` matters; any extra fields are stored in a JSON column, so different apps can post different shapes without errors.',
  })
  @ApiHeader({
    name: 'X-App-Name',
    required: false,
    description: 'Identifies the originating app (e.g. anime-downloader). Falls back to body.appName or "unknown".',
  })
  @ApiBody({ type: CreateFeedbackDto })
  @ApiResponse({ status: 201, description: 'Stored', schema: { example: { id: 12, ok: true } } })
  create(
    @Headers('x-app-name') appName: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.create(appName, body);
  }

  @Get()
  @UseGuards(FeedbackAdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: 'List feedback (admin)' })
  @ApiQuery({ name: 'app', required: false, description: 'Filter by app name' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (open/resolved)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max rows (default 50, max 200)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiResponse({ status: 200, description: 'Feedback list' })
  list(
    @Query('app') app?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.list({
      app,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Patch(':id/status')
  @UseGuards(FeedbackAdminGuard)
  @ApiSecurity('admin-token')
  @ApiOperation({ summary: 'Update a feedback status (admin)' })
  @ApiBody({ schema: { example: { status: 'resolved' } } })
  @ApiResponse({ status: 200, description: 'Updated' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.updateStatus(parseInt(id, 10), status || 'open');
  }
}
