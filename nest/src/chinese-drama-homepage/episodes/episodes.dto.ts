import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EpisodeItemDto {
  @ApiProperty({ description: 'Episode number' })
  episodeNumber!: number;

  @ApiPropertyOptional({ description: 'Episode title' })
  title?: string;

  @ApiProperty({ description: 'Source URL for the episode' })
  sourceUrl!: string;

  @ApiPropertyOptional({ description: 'Source type', enum: ['mp4', 'hls', 'dash', 'iframe'], default: 'mp4' })
  sourceType?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'VIP-only episode', default: false })
  isVip?: boolean;

  @ApiPropertyOptional({ description: 'Special/bonus episode', default: false })
  isSpecial?: boolean;
}

export class CreateEpisodeDto extends EpisodeItemDto {
  @ApiProperty({ description: 'Drama ID (string identifier)' })
  dramaId!: string;
}

export class BulkCreateEpisodesDto {
  @ApiProperty({ description: 'Drama ID (string identifier)' })
  dramaId!: string;

  @ApiProperty({ type: [EpisodeItemDto], description: 'Array of episodes to create' })
  episodes!: EpisodeItemDto[];
}

export class UpdateEpisodeDto {
  @ApiPropertyOptional({ description: 'Episode number' })
  episodeNumber?: number;

  @ApiPropertyOptional({ description: 'Episode title' })
  title?: string | null;

  @ApiPropertyOptional({ description: 'Source URL' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Source type', enum: ['mp4', 'hls', 'dash', 'iframe'] })
  sourceType?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  duration?: number | null;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({ description: 'VIP-only episode' })
  isVip?: boolean;

  @ApiPropertyOptional({ description: 'Special/bonus episode' })
  isSpecial?: boolean;

  @ApiPropertyOptional({ description: 'Status', enum: ['active', 'inactive'] })
  status?: string;
}
