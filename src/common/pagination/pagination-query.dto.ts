import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

/**
 * Transforms query parameters to an integer if valid numeric string.
 *
 * @param value - The input value to transform.
 * @returns Parsed number or original value.
 */
const queryInt = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value)
    ? Number(value)
    : value;

/**
 * Validates whether a given property was supplied in the request.
 *
 * @param _object - Target object.
 * @param value - Evaluated property value.
 * @returns True when defined.
 */
const provided = (_object: unknown, value: unknown): boolean =>
  value !== undefined;

/**
 * Data transfer object for standard page-based pagination query parameters.
 */
export class PaginationQueryDto {
  /**
   * Current page number (starts at 1).
   */
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Current page number (starts at 1)',
  })
  @ValidateIf(provided)
  @Transform(queryInt)
  @IsInt({
    message: 'Page must be a positive integer',
  })
  @Min(1, {
    message: 'Page must be at least 1',
  })
  page?: number;

  /**
   * Maximum number of items to retrieve per page.
   */
  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ValidateIf(provided)
  @Transform(queryInt)
  @IsInt({
    message: 'Limit must be a positive integer',
  })
  @Min(1, {
    message: 'Limit must be at least 1',
  })
  @Max(100, {
    message: 'Limit cannot exceed 100',
  })
  limit?: number;
}
