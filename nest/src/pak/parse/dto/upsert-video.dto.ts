import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsInt, IsObject, IsOptional, IsString, IsUrl,
  Max, MaxLength, Min,
} from 'class-validator';
import { VideoFormatEnum, VideoQualityEnum } from '../../entities/enums';

export class UpsertVideoDto {
  @ApiProperty() @IsString()
  episodeId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  sourceId?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)
  label?: string;

  @ApiProperty() @IsUrl({ require_tld: false }) @MaxLength(1000)
  url!: string;

  @ApiProperty({ enum: VideoFormatEnum, default: VideoFormatEnum.HLS })
  @IsEnum(VideoFormatEnum)
  format!: VideoFormatEnum;

  @ApiPropertyOptional({ enum: VideoQualityEnum, default: VideoQualityEnum.AUTO })
  @IsOptional() @IsEnum(VideoQualityEnum)
  quality?: VideoQualityEnum;

  @ApiPropertyOptional({ default: 'ur' })
  @IsOptional() @IsString() @MaxLength(8)
  language?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)
  subtitleUrl?: string;

  @ApiPropertyOptional({ description: 'Extra request headers (e.g. Referer for hot-linked streams)' })
  @IsOptional() @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional() @IsInt() @Min(0) @Max(1000)
  priority?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(0) @Max(1)
  isActive?: number;
}
