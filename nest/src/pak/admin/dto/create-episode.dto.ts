import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsInt, IsOptional, IsString, IsUrl,
  Max, MaxLength, Min,
} from 'class-validator';

export class CreateEpisodeDto {
  @ApiProperty() @IsString()
  dramaId!: string;

  @ApiProperty() @IsString()
  seasonId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt() @Min(1)
  number!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(255)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional() @IsInt() @Min(0)
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'YYYY-MM-DD' })
  @IsOptional() @IsDateString()
  airDate?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @IsInt() @Min(0) @Max(1)
  isPublished?: number;
}
