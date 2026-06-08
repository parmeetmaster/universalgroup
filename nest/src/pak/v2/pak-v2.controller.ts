import {
  Controller, Get, Headers, NotFoundException, Param, ParseIntPipe, Post, Query, UseInterceptors,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PakDramasService } from '../dramas/dramas.service';
import { PakEpisodesService } from '../episodes/episodes.service';
import { PakHomeService } from '../home/home.service';
import { DramaEngagementService } from '../dramas/drama-engagement.service';
import { ListDramasDto } from '../dramas/dto/list-dramas.dto';
import { TransformInterceptor } from '../common/transform.interceptor';
import { transformDramaImages, transformEpisodeImages } from './v2-transform';

@ApiTags('pak-v2')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials/v2')
export class PakV2Controller {
  constructor(
    private readonly dramasSvc: PakDramasService,
    private readonly episodesSvc: PakEpisodesService,
    private readonly homeSvc: PakHomeService,
    private readonly engagementSvc: DramaEngagementService,
  ) {}

  // ── Home ──────────────────────────────────────────

  @Get('home')
  @ApiOperation({ summary: 'V2 home feed with proxy image URLs' })
  async home() {
    const result = await this.homeSvc.getHome();
    return {
      rails: result.rails.map((rail) => ({
        ...rail,
        items: rail.items.map((item) => transformDramaImages(item)),
      })),
    };
  }

  // ── Dramas ────────────────────────────────────────

  @Get('dramas')
  @ApiOperation({ summary: 'V2 list dramas with proxy image URLs' })
  async listDramas(@Query() dto: ListDramasDto) {
    const result = await this.dramasSvc.list(dto);
    return {
      ...result,
      data: result.data.map((d) => transformDramaImages(d)),
    };
  }

  @Get('dramas/:slug')
  @ApiOperation({ summary: 'V2 drama detail with proxy image URLs (records a view)' })
  @ApiParam({ name: 'slug', type: String })
  async dramaDetail(@Param('slug') slug: string) {
    const drama = await this.dramasSvc.findBySlug(slug);
    void this.engagementSvc.recordView(slug).catch(() => undefined);
    return transformDramaImages(drama);
  }

  @Get('dramas/:slug/related')
  @ApiOperation({ summary: 'V2 related dramas with proxy image URLs' })
  @ApiParam({ name: 'slug', type: String })
  async dramaRelated(@Param('slug') slug: string) {
    const dramas = await this.dramasSvc.related(slug);
    return dramas.map((d) => transformDramaImages(d));
  }

  // ── Seasons & Episodes ────────────────────────────

  @Get('dramas/:slug/seasons')
  @ApiOperation({ summary: 'V2 list seasons for a drama' })
  @ApiParam({ name: 'slug', type: String })
  seasons(@Param('slug') slug: string) {
    return this.episodesSvc.listSeasons(slug);
  }

  @Get('dramas/:slug/seasons/:seasonNumber/episodes')
  @ApiOperation({ summary: 'V2 list episodes with proxy image URLs' })
  @ApiParam({ name: 'slug', type: String })
  @ApiParam({ name: 'seasonNumber', type: Number })
  async episodes(
    @Param('slug') slug: string,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
  ) {
    const eps = await this.episodesSvc.listEpisodes(slug, seasonNumber);
    return eps.map((ep) => transformEpisodeImages(ep));
  }

  @Get('episodes/:id')
  @ApiOperation({ summary: 'V2 episode detail with proxy image URLs' })
  @ApiParam({ name: 'id', type: String })
  async episodeDetail(@Param('id') id: string) {
    const ep = await this.episodesSvc.findById(id);
    return transformEpisodeImages(ep, ep.drama);
  }

  @Get('episodes/:id/resolve')
  @ApiOperation({ summary: 'V2 resolve episode into playable server URL(s)' })
  @ApiParam({ name: 'id', type: String })
  resolve(@Param('id') id: string) {
    return this.episodesSvc.resolveSources(id);
  }

  // ── Engagement: Like / View ─────────────────────

  @Post('dramas/:slug/like')
  @ApiOperation({ summary: 'Toggle like on a drama (like/unlike)' })
  @ApiParam({ name: 'slug', type: String })
  @ApiHeader({ name: 'X-Device-Id', required: true, description: 'Unique device identifier' })
  async toggleLike(
    @Param('slug') slug: string,
    @Headers('x-device-id') deviceId: string,
  ) {
    if (!deviceId) throw new NotFoundException('X-Device-Id header required');
    return this.engagementSvc.toggleLike(slug, deviceId);
  }

  @Post('dramas/:slug/view')
  @ApiOperation({ summary: 'Record a view for a drama' })
  @ApiParam({ name: 'slug', type: String })
  async recordView(@Param('slug') slug: string) {
    await this.engagementSvc.recordView(slug);
    return { recorded: true };
  }

  @Get('likes')
  @ApiOperation({ summary: 'Get all liked drama slugs for a device' })
  @ApiHeader({ name: 'X-Device-Id', required: true })
  async getLikedSlugs(@Headers('x-device-id') deviceId: string) {
    if (!deviceId) return { slugs: [] };
    const slugs = await this.engagementSvc.getLikedSlugs(deviceId);
    return { slugs };
  }
}
