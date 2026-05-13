import { ApiProperty } from '@nestjs/swagger';
import { ArticleSummary } from './article.model';
import { PaginationDto } from './pagination.dto';

export class CategoryResponseDto {
  @ApiProperty({ example: 'Airline News', description: 'Category name' })
  category: string;

  @ApiProperty({ type: PaginationDto, description: 'Pagination info' })
  pagination: PaginationDto;

  @ApiProperty({ type: [ArticleSummary], description: 'List of articles in this category' })
  articles: ArticleSummary[];
}
