import { Transform } from 'class-transformer';
import {
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
 * Data transfer object for inventory pagination query parameters.
 */
export class InventoryPageQueryDto {
  /**
   * Maximum number of inventory items to return.
   *
   * Defaults to the server-configured page size.
   */
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
   * Number of inventory items to skip.
   *
   * Defaults to zero.
   */
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
}