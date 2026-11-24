import { ApiProperty } from '@nestjs/swagger';

/**
 * Metadata contract describing pagination state.
 */
export interface PaginationMeta {
  /** The current active page number (1-based index). */
  currentPage: number;

  /** Total number of pages available. */
  totalPages: number;

  /** Number of items per page. */
  perPage: number;

  /** Total count of records matching the query. */
  total: number;
}

/**
 * Laravel-style resource representing structured pagination metadata.
 */
export class PaginationResource {
  /**
   * Current active page number.
   */
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Current page number',
  })
  currentPage: number;

  /**
   * Total number of pages.
   */
  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Total number of pages',
  })
  totalPages: number;

  /**
   * Number of items per page.
   */
  @ApiProperty({
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  perPage: number;

  /**
   * Total number of matching items.
   */
  @ApiProperty({
    type: Number,
    example: 48,
    description: 'Total number of items',
  })
  total: number;

  /**
   * Initializes a new instance of PaginationResource.
   *
   * @param meta - Pagination metadata parameters.
   */
  constructor(meta: PaginationMeta) {
    this.currentPage = meta.currentPage;
    this.totalPages = meta.totalPages;
    this.perPage = meta.perPage;
    this.total = meta.total;
  }

  /**
   * Factory method to create a PaginationResource instance.
   *
   * @param meta - Pagination metadata.
   * @returns Formatted PaginationResource.
   */
  static make(meta: PaginationMeta): PaginationResource {
    return new PaginationResource(meta);
  }

  /**
   * Serializes the resource to match snake_case Laravel pagination output format.
   *
   * @returns Object containing current_page, total_pages, per_page, and total.
   */
  toJSON() {
    return {
      current_page: this.currentPage,
      total_pages: this.totalPages,
      per_page: this.perPage,
      total: this.total,
    };
  }
}

/**
 * Generic response wrapper combining a result array and pagination resource.
 */
export interface PaginatedResult<T> {
  /** Collection of result items. */
  result: T[];

  /** Pagination details. */
  pagination: PaginationResource;
}
