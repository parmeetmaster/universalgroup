import { ApiProperty } from '@nestjs/swagger';
import { ArticleSummary } from './article.model';
import { PaginationDto } from './pagination.dto';

export class SearchResponseDto {
  @ApiProperty({ example: 'boeing', description: 'Search query string' })
  query: string;

  @ApiProperty({ example: 6742, description: 'Total number of results found' })
  totalResults: number;

  @ApiProperty({ type: PaginationDto, description: 'Pagination info' })
  pagination: PaginationDto;

  @ApiProperty({ type: [ArticleSummary], description: 'Search result articles' })
  results: ArticleSummary[];
}
