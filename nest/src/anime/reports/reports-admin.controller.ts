import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import {
  REPORT_STATUSES,
  ReportsService,
  type ReportStatus,
} from './reports.service';

@Controller('anime-downloader/admin/reports')
@UseGuards(AdminGuard)
export class ReportsAdminController {
  constructor(private readonly reports: ReportsService) {}

  @Get('counts')
  async counts() {
    return this.reports.counts();
  }

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const s = status && REPORT_STATUSES.includes(status as ReportStatus)
      ? (status as ReportStatus)
      : undefined;
    return this.reports.list({
      status: s,
      q,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.reports.getById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status?: string; admin_notes?: string | null },
  ) {
    const status =
      body?.status && REPORT_STATUSES.includes(body.status as ReportStatus)
        ? (body.status as ReportStatus)
        : undefined;
    if (body?.status && !status) {
      throw new BadRequestException(
        `status must be one of ${REPORT_STATUSES.join(', ')}`,
      );
    }
    return this.reports.update(id, {
      status,
      adminNotes: body?.admin_notes,
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.reports.remove(id);
    return { ok: true };
  }
}
