import {
  BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakParseService } from './parse.service';
import { PakDramaximaDriver } from './drivers/dramaxima.driver';
import { PakParseOrchestratorService } from './scheduler/parse-orchestrator.service';
import { ParseTier } from './scheduler/tier-classifier';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { UpsertVideoDto } from './dto/upsert-video.dto';
import { PakAdminTokenGuard } from '../common/admin-token.guard';

@ApiTags('pak-parse')
@ApiHeader({ name: 'X-Admin-Token', required: true })
@UseGuards(PakAdminTokenGuard)
@Controller('pakistani-serials/parse')
export class PakParseController {
  constructor(
    private readonly svc: PakParseService,
    private readonly dramaxima: PakDramaximaDriver,
    private readonly orchestrator: PakParseOrchestratorService,
  ) {}

  // --- orchestrator (multi-tier scheduler) ---

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Force a scheduler run outside the normal cron. Pass {tier} for a tier ' +
      'sweep, or {dramaSlug} for a single-drama force-refresh (bypasses ' +
      'fingerprint). At least one must be set.',
  })
  async trigger(
    @Body() body: { tier?: ParseTier; dramaSlug?: string },
  ): Promise<unknown> {
    if (body.dramaSlug) return this.orchestrator.runDramaBySlug(body.dramaSlug);
    if (body.tier) return this.orchestrator.runTier(body.tier);
    throw new BadRequestException('Provide either {tier} or {dramaSlug}');
  }

  @Get('stats')
  @ApiOperation({
    summary:
      'Aggregate metrics over recent parse runs. ?window=24h|7d|30d. ' +
      'Default 24h.',
  })
  stats(@Query('window') window?: string): Promise<unknown> {
    const ms = parseWindow(window ?? '24h');
    return this.orchestrator.recentRunStats(ms);
  }

  @Get('drama-state')
  @ApiOperation({
    summary: 'Per-drama parse state: fingerprint, last run, tier, recent runs.',
  })
  dramaState(@Query('slug') slug: string): Promise<unknown> {
    if (!slug) throw new BadRequestException('slug required');
    return this.orchestrator.dramaState(slug);
  }

  // --- dramaxima importer ---

  @Post('dramaxima/dramas/:slug/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Scrape episodes for one dramaxima drama (by slug)',
  })
  importDramaximaBySlug(@Param('slug') slug: string) {
    return this.dramaxima.importBySlug(slug);
  }

  @Post('dramaxima/dramas/by-id/:id/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Scrape episodes for one dramaxima drama (by numeric id)',
  })
  importDramaximaById(@Param('id') id: string) {
    return this.dramaxima.importById(id);
  }

  @Post('dramaxima/import-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Scrape every drama whose sourceUrl points at dramaxima.com',
  })
  importDramaximaAll() {
    return this.dramaxima.importAll();
  }

  @Post('dramaxima/discover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Discover new dramas on dramaxima not yet in our DB, auto-create + import',
  })
  discover() {
    return this.orchestrator.runDiscovery();
  }

  @Post('backfill-air-dates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-import all dramas from sitemap to fill NULL air_dates from sitemap lastmod',
  })
  async backfillAirDates() {
    const importResults = await this.dramaxima.importAll();
    const stillNull = await this.svc.countNullAirDates();

    return {
      dramasProcessed: importResults.length,
      totalImported: importResults.reduce((s, r) => s + r.imported, 0),
      remainingNullAirDates: stillNull,
    };
  }

  // --- sources ---

  @Get('sources')
  @ApiOperation({ summary: 'List all parse sources' })
  listSources() {
    return this.svc.listSources();
  }

  @Post('sources')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new parse source' })
  createSource(@Body() dto: CreateSourceDto) {
    return this.svc.createSource(dto);
  }

  @Patch('sources/:id')
  @ApiOperation({ summary: 'Update a parse source' })
  updateSource(@Param('id') id: string, @Body() dto: UpdateSourceDto) {
    return this.svc.updateSource(id, dto);
  }

  @Delete('sources/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a parse source (videos keep source_id = null)' })
  deleteSource(@Param('id') id: string) {
    return this.svc.deleteSource(id);
  }

  // --- episode_videos ---

  @Get('episodes/:episodeId/videos')
  @ApiOperation({ summary: 'List all video streams (mirrors) for an episode' })
  listVideos(@Param('episodeId') episodeId: string) {
    return this.svc.listVideosForEpisode(episodeId);
  }

  @Post('videos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upsert a parsed video stream for an episode' })
  upsertVideo(@Body() dto: UpsertVideoDto) {
    return this.svc.upsertVideo(dto);
  }

  @Delete('videos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a video stream' })
  deleteVideo(@Param('id') id: string) {
    return this.svc.deleteVideo(id);
  }

  // --- runs (log) ---

  @Get('runs')
  @ApiOperation({ summary: 'List recent parse runs (observability)' })
  listRuns(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.svc.listRuns(limit ?? 50);
  }
}

function parseWindow(raw: string): number {
  const m = raw.trim().match(/^(\d+)\s*(h|d)$/i);
  if (!m) return 24 * 3600_000;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  return unit === 'd' ? n * 86_400_000 : n * 3600_000;
}
