import { Controller, Get, Param, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PakEpisodesService } from './episodes.service';
import { TransformInterceptor } from '../common/transform.interceptor';

@ApiTags('pak-episodes')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials')
export class PakEpisodesController {
  constructor(private readonly svc: PakEpisodesService) {}

  @Get('dramas/:slug/seasons')
  @ApiOperation({ summary: 'List seasons for a drama' })
  seasons(@Param('slug') slug: string) {
    return this.svc.listSeasons(slug);
  }

  @Get('dramas/:slug/seasons/:seasonNumber/episodes')
  @ApiOperation({ summary: 'List episodes in a season' })
  episodes(
    @Param('slug') slug: string,
    @Param('seasonNumber', ParseIntPipe) seasonNumber: number,
  ) {
    return this.svc.listEpisodes(slug, seasonNumber);
  }

  @Get('episodes/:id')
  @ApiOperation({ summary: 'Get an episode with active video URLs' })
  detail(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Get('episodes/:id/resolve')
  @ApiOperation({ summary: 'Runtime-resolve an episode into playable server URL(s)' })
  resolve(@Param('id') id: string) {
    return this.svc.resolveSources(id);
  }
}
