import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class YouTubeExtractRequestDto {
  @ApiProperty({
    description: 'YouTube video URL',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/,
    { message: 'Must be a valid YouTube URL' },
  )
  url: string;
}

export class QualityLinkDto {
  @ApiProperty({ example: '1080p' })
  quality: string;

  @ApiProperty({ example: 'https://rr3---sn-...' })
  url: string;
}

export class CaptionDto {
  @ApiProperty({ example: 'en' })
  lang: string;

  @ApiProperty({ example: 'https://www.youtube.com/api/timedtext?...' })
  url: string;
}

export class YouTubeExtractResponseDto {
  @ApiProperty({ example: 'Never Gonna Give You Up' })
  title: string;

  @ApiProperty({ example: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' })
  thumbnail: string;

  @ApiProperty({ example: 212, description: 'Duration in seconds' })
  duration: number;

  @ApiProperty({ type: [QualityLinkDto] })
  qualities: QualityLinkDto[];

  @ApiProperty({ type: [CaptionDto] })
  captions: CaptionDto[];
}
