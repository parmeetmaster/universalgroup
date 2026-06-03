import {
  Controller, Get, Headers, NotFoundException, Param, Post, Query, UseInterceptors,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PakDramasService } from './dramas.service';
import { DramaEngagementService } from './drama-engagement.service';
import { ListDramasDto } from './dto/list-dramas.dto';
import { TransformInterceptor } from '../common/transform.interceptor';

@ApiTags('pak-dramas')
@UseInterceptors(TransformInterceptor)
@Controller('pakistani-serials')
export class PakDramasController {
  constructor(
    private readonly svc: PakDramasService,
    private readonly engagementSvc: DramaEngagementService,
  ) {}

  @Get('dramas/rail/:railId')
  @ApiOperation({ summary: 'Get all dramas for a home rail with pagination + genre filter' })
  @ApiParam({ name: 'railId', description: 'Rail ID: hero, latest-releases, new-dramas, monthly-popular, completed, or DB rail ID' })
  @ApiQuery({ name: 'genre', required: false, description: 'Filter by genre slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 50)' })
  @ApiResponse({ status: 200, description: 'Paginated dramas for the rail' })
  async railDramas(
    @Param('railId') railId: string,
    @Query('genre') genre?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.svc.railDramas(railId, genre, parseInt(page), parseInt(limit));
  }

  @Get('dramas')
  @ApiOperation({ summary: 'List dramas (paginated, filterable)' })
  list(@Query() dto: ListDramasDto) {
    return this.svc.list(dto);
  }

  @Get('dramas/:slug')
  @ApiOperation({ summary: 'Get a drama by slug' })
  @ApiParam({ name: 'slug', type: String })
  detail(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Get('dramas/:slug/related')
  @ApiOperation({ summary: 'Related dramas by shared genre' })
  @ApiParam({ name: 'slug', type: String })
  related(@Param('slug') slug: string) {
    return this.svc.related(slug);
  }

  @Post('dramas/:slug/like')
  @ApiOperation({ summary: 'Toggle like on a drama (like/unlike)' })
  @ApiParam({ name: 'slug', type: String })
  @ApiHeader({ name: 'X-Device-Id', required: true })
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
