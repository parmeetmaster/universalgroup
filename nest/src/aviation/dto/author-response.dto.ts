import { ApiProperty } from '@nestjs/swagger';
import { ArticleSummary } from './article.model';
import { PaginationDto } from './pagination.dto';

export class AuthorResponseDto {
  @ApiProperty({ example: 'Helen William', description: 'Author name' })
  name: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Author avatar URL' })
  avatar: string;

  @ApiProperty({ example: 'https://example.com', description: 'Author website URL' })
  website: string;

  @ApiProperty({ type: PaginationDto, description: 'Pagination info' })
  pagination: PaginationDto;

  @ApiProperty({ type: [ArticleSummary], description: 'Articles by this author' })
  articles: ArticleSummary[];
}
