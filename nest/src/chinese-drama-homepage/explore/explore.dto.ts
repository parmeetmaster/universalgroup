import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum DramaType {
  SHORT_DRAMA = 'short_drama',
  WEB_SERIES = 'web_series',
  ANIME = 'anime',
  ALL = 'all',
}

export enum DramaOrigin {
  CHINESE = 'chinese',
  ALL = 'all',
}

export enum DramaLanguage {
  SUBBED = 'subbed',
  DUBBED = 'dubbed',
  ALL = 'all',
}

export enum DramaSortBy {
  POPULAR = 'popular',
  LATEST = 'latest',
  ALL = 'all',
}

export class ExploreRequestDto {
  @ApiPropertyOptional({ description: 'Single genre name to filter mostRecommended (case-insensitive)', example: 'Romance' })
  genre?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;
}

export class AnimeGridRequestDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;
}

export class NewReleaseRequestDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;
}

export class FilterRequestDto {
  @ApiPropertyOptional({
    enum: DramaType,
    enumName: 'DramaType',
    default: DramaType.ALL,
    description: 'Filter by drama type',
    examples: {
      'all': { value: 'all', summary: 'No filter — show all types' },
      'short_drama': { value: 'short_drama', summary: 'Short dramas only' },
    },
  })
  @IsOptional() @IsEnum(DramaType)
  type?: DramaType;

  @ApiPropertyOptional({
    enum: DramaOrigin,
    enumName: 'DramaOrigin',
    default: DramaOrigin.ALL,
    description: 'Filter by origin country',
    examples: {
      'all': { value: 'all', summary: 'No filter — show all origins' },
      'chinese': { value: 'chinese', summary: 'Chinese dramas only' },
    },
  })
  @IsOptional() @IsEnum(DramaOrigin)
  origin?: DramaOrigin;

  @ApiPropertyOptional({
    enum: DramaLanguage,
    enumName: 'DramaLanguage',
    default: DramaLanguage.ALL,
    description: 'Filter by language',
    examples: {
      'all': { value: 'all', summary: 'No filter — show all languages' },
      'subbed': { value: 'subbed', summary: 'Subtitled dramas' },
      'dubbed': { value: 'dubbed', summary: 'Dubbed audio dramas' },
    },
  })
  @IsOptional() @IsEnum(DramaLanguage)
  language?: DramaLanguage;

  @ApiPropertyOptional({
    enum: DramaSortBy,
    enumName: 'DramaSortBy',
    default: DramaSortBy.ALL,
    description: 'Sort order',
    examples: {
      'all': { value: 'all', summary: 'Default sort (popular)' },
      'popular': { value: 'popular', summary: 'By all-time watch count DESC' },
      'latest': { value: 'latest', summary: 'By creation date DESC' },
    },
  })
  @IsOptional() @IsEnum(DramaSortBy)
  sortBy?: DramaSortBy;

  @ApiPropertyOptional({
    description: 'Genre name to filter by (case-insensitive)',
    example: 'Romance',
  })
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;
}

export class GenreDataRequestDto {
  @ApiProperty({ description: 'Genre name (case-insensitive)', example: 'Romance' })
  genre!: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;
}

export class SearchSelectDto {
  @ApiProperty({ description: 'Drama ID (slug)', example: 'dont-regret-when-she-let-go' })
  dramaId!: string;
}

export class SearchRequestDto {
  @ApiProperty({
    description: 'Search query — all words must be present in the drama name (case-insensitive). Results ranked by relevance: exact match > starts with > contains all words.',
    example: 'love story',
  })
  query!: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  page?: number;
}

export class IncrementWatchDto {
  @ApiProperty({ description: 'Array of drama IDs (slugs) to increment watch counts', example: ['dont-regret-when-she-let-go', 'someone-you-loved'], type: [String] })
  dramaIds!: string[];
}

export class SearchRecommendationRequestDto {
  @ApiProperty({
    description: 'Array of genre names in priority order. Used to build personalized search recommendations and new releases.',
    example: ['Romance', 'Action', 'Comedy'],
    type: [String],
  })
  genres!: string[];
}
