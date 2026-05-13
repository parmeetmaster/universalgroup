import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from './pagination.dto';

export class AddYoutubeShortDto {
  @ApiProperty({ example: 'https://www.youtube.com/shorts/ftBuy5YJg4A', description: 'YouTube Shorts URL' })
  youtubeUrl: string;
}

export class YoutubeShortItemDto {
  @ApiProperty({ example: 1, description: 'Video ID' })
  id: number;

  @ApiProperty({ example: 'ftBuy5YJg4A', description: 'YouTube video ID for embedding/playback' })
  videoId: string;

  @ApiProperty({ example: 'Amazing Aviation Moment', description: 'Video title from YouTube' })
  title: string;

  @ApiProperty({ example: 'https://i.ytimg.com/vi/ftBuy5YJg4A/hqdefault.jpg', description: 'Thumbnail URL' })
  thumbnailUrl: string;

  @ApiPropertyOptional({ example: 'https://rr2---sn-xxx.googlevideo.com/videoplayback?...', description: 'Direct MP4 streaming URL (expires ~6hrs). Null if unavailable, use videoId as fallback.' })
  streamingUrl: string | null;

  @ApiProperty({ example: 30, description: 'Video duration in seconds' })
  durationSeconds: number;

  @ApiProperty({ example: 'https://www.youtube.com/shorts/ftBuy5YJg4A', description: 'Original YouTube URL' })
  youtubeUrl: string;

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z', description: 'Date when video was added' })
  createdAt: Date;
}

export class YoutubeShortListResponseDto {
  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  @ApiProperty({ type: [YoutubeShortItemDto] })
  videos: YoutubeShortItemDto[];
}
