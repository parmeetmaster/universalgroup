import { ApiProperty } from '@nestjs/swagger';
import { ArticleSummary } from './article.model';
import { PaginationDto } from './pagination.dto';

export class TagResponseDto {
  @ApiProperty({ example: 'boeing', description: 'Tag name' })
  tag: string;

  @ApiProperty({ type: PaginationDto, description: 'Pagination info' })
  pagination: PaginationDto;

  @ApiProperty({ type: [ArticleSummary], description: 'Articles with this tag' })
  articles: ArticleSummary[];
}
