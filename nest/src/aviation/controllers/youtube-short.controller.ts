import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { YoutubeShortService } from '../services/youtube-short.service';
import { AddYoutubeShortDto, YoutubeShortItemDto, YoutubeShortListResponseDto } from '../dto/youtube-short.dto';

@ApiTags('YouTube Shorts')
@Controller('aviation-news/shorts')
export class YoutubeShortController {
  constructor(private readonly shortService: YoutubeShortService) {}

  @Post()
  @ApiOperation({ summary: 'Add a YouTube Short video', description: 'Saves the YouTube Short URL to database' })
  @ApiBody({ type: AddYoutubeShortDto })
  @ApiResponse({ status: 201, description: 'Video added successfully', type: YoutubeShortItemDto })
  async addVideo(@Body() body: AddYoutubeShortDto) {
    return this.shortService.addVideo(body.youtubeUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Get YouTube Shorts', description: 'Returns paginated list with direct streaming URLs (via yt-dlp) and videoId fallback' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Videos per page (default: 10, max: 20)', example: '10' })
  @ApiResponse({ status: 200, description: 'Paginated list of videos', type: YoutubeShortListResponseDto })
  async getVideos(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    return this.shortService.getVideos(pageNum, limitNum);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a YouTube Short', description: 'Soft-deletes the video (sets isActive to false)' })
  @ApiParam({ name: 'id', description: 'Video ID', example: '1' })
  @ApiResponse({ status: 200, description: 'Video removed' })
  async deleteVideo(@Param('id') id: string) {
    await this.shortService.deleteVideo(parseInt(id, 10));
    return { success: true, message: 'Video removed' };
  }
}
