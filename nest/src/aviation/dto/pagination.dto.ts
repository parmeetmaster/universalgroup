import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ example: 675, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ example: false, description: 'Has previous page' })
  hasPrevious: boolean;

  @ApiProperty({ example: 2, description: 'Next page number (null if last page)', nullable: true })
  nextPage: number | null;

  @ApiProperty({ example: null, description: 'Previous page number (null if first page)', nullable: true })
  previousPage: number | null;
}

export function buildPagination(currentPage: number, totalPages: number): PaginationDto {
  return {
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null,
  };
}
