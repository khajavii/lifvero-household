import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { NewInventoryItem } from '../repositories/inventory.repository';
import { messages } from '../../../messages';

/**
 * Regular expression for YYYY-MM-DD date format.
 */
const datePattern = /^(?!0000)\d{4}-\d{2}-\d{2}(?![\s\S])/;

/**
 * Regular expression for non-negative decimal amounts with up to two decimal places.
 */
const moneyPattern = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?(?![\s\S])/;

/**
 * Regular expression for lookup codes without leading or trailing whitespace.
 */
const codePattern = /^[^\s\x00](?:[^\x00]*[^\s\x00])?(?![\s\S])/u;

/**
 * Trims string values before validation.
 *
 * @param value - The transformation input.
 * @returns The trimmed string or the original value.
 */
const trim = ({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value;

/**
 * Converts numeric query string values to numbers.
 *
 * @param value - The transformation input.
 * @returns The converted number or the original value.
 */
const queryInt = ({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d+$/.test(value)
        ? Number(value)
        : value;

/**
 * Determines whether an optional property was provided.
 *
 * @param value - The property value.
 * @returns True when the value is not undefined.
 */
const provided = (_object: unknown, value: unknown) =>
    value !== undefined;

/**
 * Data transfer object for creating a personal inventory item.
 *
 * Validates item information before passing it to the inventory service.
 */
export class CreateInventoryItemDto implements NewInventoryItem {
  /**
   * Name of the inventory item.
   */
  @ApiProperty({
    example: 'Laptop',
    description: 'Name of the inventory item',
    maxLength: 150,
  })
  @Transform(trim)
  @IsString({ message: messages.inventory.VALIDATION_ITEM_NAME_INVALID })
  @MinLength(1, {
    message: messages.inventory.VALIDATION_ITEM_NAME_REQUIRED,
  })
  @MaxLength(150, {
    message: messages.inventory.VALIDATION_ITEM_NAME_LENGTH,
  })
  @Matches(/^[^\x00]+$/u, {
    message: messages.inventory.VALIDATION_ITEM_NAME_INVALID,
  })
  itemName!: string;

  /**
   * Code identifying the room containing the item.
   */
  @ApiProperty({
    example: 'living_room',
    description: 'Room code lookup value',
    maxLength: 40,
  })
  @IsString({
    message: messages.inventory.VALIDATION_ROOM_CODE_INVALID,
  })
  @MaxLength(40, {
    message: messages.inventory.VALIDATION_ROOM_CODE_INVALID,
  })
  @Matches(codePattern, {
    message: messages.inventory.VALIDATION_ROOM_CODE_INVALID,
  })
  roomCode!: string;

  /**
   * Code identifying the item's category.
   */
  @ApiProperty({
    example: 'electronics',
    description: 'Category code lookup value',
    maxLength: 40,
  })
  @IsString({
    message: messages.inventory.VALIDATION_CATEGORY_CODE_INVALID,
  })
  @MaxLength(40, {
    message: messages.inventory.VALIDATION_CATEGORY_CODE_INVALID,
  })
  @Matches(codePattern, {
    message: messages.inventory.VALIDATION_CATEGORY_CODE_INVALID,
  })
  categoryCode!: string;

  /**
   * Date when the item was purchased.
   *
   * Must use the YYYY-MM-DD format.
   */
  @ApiProperty({
    example: '2026-01-20',
    description: 'Purchase date in YYYY-MM-DD format',
  })
  @IsString({
    message: messages.inventory.VALIDATION_PURCHASE_DATE_INVALID,
  })
  @Matches(datePattern, {
    message: messages.inventory.VALIDATION_PURCHASE_DATE_INVALID,
  })
  @IsISO8601(
      { strict: true },
      {
        message: messages.inventory.VALIDATION_PURCHASE_DATE_INVALID,
      },
  )
  purchaseDate!: string;

  /**
   * Code identifying the item's warranty option.
   */
  @ApiProperty({
    example: '1_year',
    description: 'Warranty option lookup code',
    maxLength: 40,
  })
  @IsString({
    message: messages.inventory.VALIDATION_WARRANTY_CODE_INVALID,
  })
  @MaxLength(40, {
    message: messages.inventory.VALIDATION_WARRANTY_CODE_INVALID,
  })
  @Matches(codePattern, {
    message: messages.inventory.VALIDATION_WARRANTY_CODE_INVALID,
  })
  warrantyCode!: string;

  /**
   * Optional purchase amount in the configured reporting currency.
   *
   * Must be a non-negative decimal with up to two decimal places.
   */
  @ApiPropertyOptional({
    example: '999.99',
    description: 'Purchase amount with up to 2 decimal places',
  })
  @ValidateIf(provided)
  @IsString({
    message: messages.inventory.VALIDATION_PURCHASE_AMOUNT_INVALID,
  })
  @Matches(moneyPattern, {
    message: messages.inventory.VALIDATION_PURCHASE_AMOUNT_INVALID,
  })
  purchaseAmount?: string;
}

/**
 * Data transfer object for inventory pagination and search query parameters.
 */
export class InventoryPageQueryDto {
  /**
   * Page number (starts at 1).
   */
  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Current page number',
  })
  @ValidateIf(provided)
  @Transform(queryInt)
  @IsInt({
    message: messages.inventory.VALIDATION_LIMIT_INVALID,
  })
  @Min(1, {
    message: messages.inventory.VALIDATION_LIMIT_INVALID,
  })
  page?: number;

  /**
   * Maximum number of inventory items to return.
   *
   * Defaults to the server-configured page size.
   */
  @ApiPropertyOptional({
    type: Number,
    example: 10,
    description: 'Number of items per page',
  })
  @ValidateIf(provided)
  @Transform(queryInt)
  @IsInt({
    message: messages.inventory.VALIDATION_LIMIT_INVALID,
  })
  @Min(1, {
    message: messages.inventory.VALIDATION_LIMIT_INVALID,
  })
  @Max(2147483646, {
    message: messages.inventory.VALIDATION_LIMIT_INVALID,
  })
  limit?: number;

  /**
   * Number of inventory items to skip (optional alternative to page).
   *
   * Defaults to zero.
   */
  @ApiPropertyOptional({
    type: Number,
    example: 0,
    description: 'Number of items to skip',
  })
  @ValidateIf(provided)
  @Transform(queryInt)
  @IsInt({
    message: messages.inventory.VALIDATION_OFFSET_INVALID,
  })
  @Min(0, {
    message: messages.inventory.VALIDATION_OFFSET_INVALID,
  })
  @Max(Number.MAX_SAFE_INTEGER, {
    message: messages.inventory.VALIDATION_OFFSET_INVALID,
  })
  offset?: number;

  /**
   * Search term matching item name.
   */
  @ApiPropertyOptional({
    type: String,
    example: 'Laptop',
    description: 'Search by item name',
    maxLength: 150,
  })
  @ValidateIf(provided)
  @Transform(trim)
  @IsString({
    message: messages.inventory.VALIDATION_ITEM_NAME_INVALID,
  })
  @MaxLength(150, {
    message: messages.inventory.VALIDATION_ITEM_NAME_LENGTH,
  })
  search?: string;

  /**
   * Category code filter.
   */
  @ApiPropertyOptional({
    type: String,
    example: 'electronics',
    description: 'Filter by category code',
    maxLength: 40,
  })
  @ValidateIf(provided)
  @Transform(trim)
  @IsString({
    message: messages.inventory.VALIDATION_CATEGORY_CODE_INVALID,
  })
  @MaxLength(40)
  categoryCode?: string;
}

/**
 * Data transfer object for updating the active status of an inventory item.
 */
export class UpdateInventoryStatusDto {
  /**
   * Whether the inventory item is active.
   */
  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Active status of the inventory item',
  })
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean({
    message: messages.inventory.VALIDATION_IS_ACTIVE_INVALID,
  })
  isActive!: boolean;
}

