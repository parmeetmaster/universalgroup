import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DramaStatusEnum, DramaTypeEnum } from '../../entities/enums';
import { PaginationDto } from '../../common/pagination.dto';

export class ListDramasDto extends PaginationDto {
  @ApiPropertyOptional({ enum: DramaTypeEnum })
  @IsOptional()
  @IsEnum(DramaTypeEnum)
  type?: DramaTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre_slug?: string;

  @ApiPropertyOptional({ enum: DramaStatusEnum })
  @IsOptional()
  @IsEnum(DramaStatusEnum)
  status?: DramaStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Free-text search query' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['newest', 'popular', 'rating'] })
  @IsOptional()
  @IsString()
  sort?: 'newest' | 'popular' | 'rating';
}
