import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsISO8601, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import type { NewInventoryItem } from '../repositories/inventory.repository';

const datePattern = /^(?!0000)\d{4}-\d{2}-\d{2}(?![\s\S])/;
const moneyPattern = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?(?![\s\S])/;
const codePattern = /^[^\s\x00](?:[^\x00]*[^\s\x00])?(?![\s\S])/u;
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const queryInt = ({ value }: { value: unknown }) => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
const provided = (_object: unknown, value: unknown) => value !== undefined;

export class CreateInventoryItemDto implements NewInventoryItem {
  @ApiProperty({ maxLength: 150, example: 'Vacuum cleaner' })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(150) @Matches(/^[^\x00]+$/u)
  itemName!: string;

  @ApiProperty({ maxLength: 40, description: 'Code returned by GET /inventory/rooms' })
  @IsString() @MaxLength(40) @Matches(codePattern)
  roomCode!: string;

  @ApiProperty({ maxLength: 40, description: 'Code returned by GET /inventory/categories' })
  @IsString() @MaxLength(40) @Matches(codePattern)
  categoryCode!: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-01-20' })
  @IsString() @Matches(datePattern) @IsISO8601({ strict: true })
  purchaseDate!: string;

  @ApiProperty({ maxLength: 40, description: 'Code returned by GET /inventory/warranties' })
  @IsString() @MaxLength(40) @Matches(codePattern)
  warrantyCode!: string;

  @ApiPropertyOptional({ type: String, pattern: moneyPattern.source, example: '199.99', description: 'Decimal amount in the configured reporting currency' })
  @ValidateIf(provided) @IsString() @Matches(moneyPattern)
  purchaseAmount?: string;
}

export class InventoryPageQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1, description: 'Default and maximum are configured by the server' })
  @ValidateIf(provided) @Transform(queryInt) @IsInt() @Min(1) @Max(2147483646)
  limit?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0, maximum: Number.MAX_SAFE_INTEGER })
  @ValidateIf(provided) @Transform(queryInt) @IsInt() @Min(0) @Max(Number.MAX_SAFE_INTEGER)
  offset?: number;
}
