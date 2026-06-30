import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CdEpisodesService } from './episodes.service';
import { BulkCreateEpisodesDto, CreateEpisodeDto, UpdateEpisodeDto } from './episodes.dto';

@ApiTags('Chinese Drama - Episodes')
@Controller('chinese-drama/episodes')
export class CdEpisodesController {
  constructor(private readonly episodesService: CdEpisodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a single episode for a drama' })
  @ApiBody({ type: CreateEpisodeDto })
  @ApiResponse({ status: 201, description: 'Episode created' })
  @ApiResponse({ status: 404, description: 'Drama not found' })
  async create(@Body() dto: CreateEpisodeDto) {
    return this.episodesService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create episodes for a drama' })
  @ApiBody({ type: BulkCreateEpisodesDto })
  @ApiResponse({ status: 201, description: 'Episodes created, returns count' })
  @ApiResponse({ status: 404, description: 'Drama not found' })
  async bulkCreate(@Body() dto: BulkCreateEpisodesDto) {
    return this.episodesService.bulkCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List episodes for a drama, sorted by episode number' })
  @ApiQuery({ name: 'dramaId', required: true, description: 'Drama string ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default 50, max 200)' })
  @ApiResponse({ status: 200, description: 'Paginated episode list' })
  @ApiResponse({ status: 404, description: 'Drama not found' })
  async findByDrama(
    @Query('dramaId') dramaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.episodesService.findByDrama(
      dramaId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get episode statistics' })
  @ApiResponse({ status: 200, description: 'Total episodes and dramas with episodes count' })
  async getStats() {
    return this.episodesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single episode by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Episode ID' })
  @ApiResponse({ status: 200, description: 'Episode with drama relation' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update an episode' })
  @ApiParam({ name: 'id', type: Number, description: 'Episode ID' })
  @ApiBody({ type: UpdateEpisodeDto })
  @ApiResponse({ status: 200, description: 'Updated episode' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEpisodeDto) {
    return this.episodesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an episode' })
  @ApiParam({ name: 'id', type: Number, description: 'Episode ID' })
  @ApiResponse({ status: 200, description: 'Episode deleted, drama episodeCount updated' })
  @ApiResponse({ status: 404, description: 'Episode not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.episodesService.remove(id);
  }
}
