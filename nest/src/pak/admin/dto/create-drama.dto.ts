import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray, IsEnum, IsInt, IsOptional, IsString, IsUrl,
  Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { DramaStatusEnum, DramaTypeEnum } from '../../entities/enums';

export class CreateDramaDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(255)
  title!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(255)
  slug!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  synopsis?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500)
  posterUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500)
  backdropUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsUrl() @MaxLength(500)
  trailerUrl?: string;

  @ApiProperty({ enum: DramaTypeEnum, default: DramaTypeEnum.DRAMA })
  @IsEnum(DramaTypeEnum)
  type!: DramaTypeEnum;

  @ApiProperty({ enum: DramaStatusEnum, default: DramaStatusEnum.ONGOING })
  @IsEnum(DramaStatusEnum)
  status!: DramaStatusEnum;

  @ApiPropertyOptional({ minimum: 1900, maximum: 2100 })
  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  releaseYear?: number;

  @ApiPropertyOptional({ default: 'ur' })
  @IsOptional() @IsString() @MaxLength(8)
  language?: string;

  @ApiPropertyOptional({ type: [String], description: 'Genre slugs' })
  @IsOptional() @IsArray() @IsString({ each: true })
  genreSlugs?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(1)
  isFeatured?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(1)
  isPublished?: number;

  @ApiPropertyOptional({ description: 'Source URL (if imported by a scraper)' })
  @IsOptional() @IsString() @MaxLength(500)
  sourceUrl?: string;
}
