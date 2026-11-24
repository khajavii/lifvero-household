import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min, ValidateIf } from 'class-validator';

const queryInt = ({ value }: { value: unknown }) =>
  typeof value === 'string' && /^\d+$/.test(value)
    ? Number(value)
    : value;

const provided = (_object: unknown, value: unknown) =>
  value !== undefined;

export class PaginationQueryDto {
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
