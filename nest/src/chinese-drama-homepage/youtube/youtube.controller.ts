import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { YouTubeService } from './youtube.service';
import {
  YouTubeExtractRequestDto,
  YouTubeExtractResponseDto,
} from './youtube.dto';

@ApiTags('Chinese Drama - YouTube')
@Controller('chinese-drama/youtube')
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @Post('extract')
  @ApiOperation({
    summary: 'Extract streaming links, captions, and metadata from a YouTube video',
  })
  @ApiBody({ type: YouTubeExtractRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Extracted video data with multiple quality links and captions',
    type: YouTubeExtractResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid YouTube URL or extraction failed' })
  async extract(
    @Body() dto: YouTubeExtractRequestDto,
  ): Promise<YouTubeExtractResponseDto> {
    return this.youtubeService.extract(dto.url);
  }
}
