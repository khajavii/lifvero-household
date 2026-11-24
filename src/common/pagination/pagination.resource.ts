import { ApiProperty } from '@nestjs/swagger';

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
}

export class PaginationResource {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Current page number',
  })
  currentPage: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Total number of pages',
  })
  totalPages: number;

  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  perPage: number;

  @ApiProperty({
    type: Number,
    example: 48,
    description: 'Total number of items',
  })
  total: number;

  constructor(meta: PaginationMeta) {
    this.currentPage = meta.currentPage;
    this.totalPages = meta.totalPages;
    this.perPage = meta.perPage;
    this.total = meta.total;
  }

  static make(meta: PaginationMeta): PaginationResource {
    return new PaginationResource(meta);
  }

  toJSON() {
    return {
      current_page: this.currentPage,
      total_pages: this.totalPages,
      per_page: this.perPage,
      total: this.total,
    };
  }
}

export interface PaginatedResult<T> {
  result: T[];
  pagination: PaginationResource;
}
