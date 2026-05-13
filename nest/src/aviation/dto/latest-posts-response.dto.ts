import { ApiProperty } from '@nestjs/swagger';
import { ArticleSummary } from './article.model';
import { PaginationDto } from './pagination.dto';

export class LatestPostsResponseDto {
  @ApiProperty({ type: PaginationDto, description: 'Pagination info' })
  pagination: PaginationDto;

  @ApiProperty({ type: [ArticleSummary], description: 'List of latest articles' })
  articles: ArticleSummary[];
}
