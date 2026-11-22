import { ApiProperty } from '@nestjs/swagger';
import { messages } from '../../../messages';

/**
 * Represents a generic inventory lookup response.
 */
export class InventoryLookupDto {
  @ApiProperty({
    type: String,
    example: 'living_room',
    description: messages.inventory.LOOKUP_CODE_DESCRIPTION,
  })
  code!: string;

  @ApiProperty({
    type: String,
    example: 'inventory.rooms.living_room',
    description: messages.inventory.TRANSLATION_KEY_DESCRIPTION,
  })
  translationKey!: string;
}

/**
 * Represents an inventory warranty option.
 */
export class InventoryWarrantyDto extends InventoryLookupDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 12,
    description: messages.inventory.WARRANTY_DURATION_DESCRIPTION,
  })
  durationMonths!: number | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: messages.inventory.WARRANTY_LIFETIME_DESCRIPTION,
  })
  isLifetime!: boolean;
}

/**
 * Represents an inventory item response.
 */
export class InventoryItemDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: messages.inventory.ITEM_ID_DESCRIPTION,
  })
  id!: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: messages.inventory.HOUSEHOLD_ID_DESCRIPTION,
  })
  householdId!: string;

  @ApiProperty({
    type: String,
    example: 'Vacuum cleaner',
  })
  itemName!: string;

  @ApiProperty({
    type: String,
    example: 'living_room',
  })
  roomCode!: string;

  @ApiProperty({
    type: String,
    example: 'electronics',
  })
  categoryCode!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    nullable: true,
    example: '2026-01-20',
  })
  purchaseDate!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'one_year',
  })
  warrantyCode!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '199.99',
  })
  purchaseAmount!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'USD',
  })
  currency!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-20T10:30:00.000Z',
    description: messages.inventory.CREATED_AT_DESCRIPTION,
  })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-01-20T10:30:00.000Z',
    description: messages.inventory.UPDATED_AT_DESCRIPTION,
  })
  updatedAt!: Date;
}

/**
 * Represents a paginated inventory response.
 */
export class InventoryPageDto {
  @ApiProperty({
    type: [InventoryItemDto],
    description: messages.inventory.LIST_ITEMS_DESCRIPTION,
  })
  items!: InventoryItemDto[];

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 20,
    description: 'Offset for the next page. Null when no more items exist.',
  })
  nextOffset!: number | null;
}

/**
 * Represents aggregated personal inventory metrics.
 */
export class InventorySummaryDto {
  @ApiProperty({
    type: Number,
    example: 25,
    description: messages.inventory.TOTAL_ITEMS_DESCRIPTION,
  })
  totalItems!: number;

  @ApiProperty({
    type: String,
    example: '199.99',
    description: messages.inventory.TOTAL_VALUE_DESCRIPTION,
  })
  totalValue!: string;

  @ApiProperty({
    type: String,
    example: 'USD',
    description: messages.inventory.CURRENCY_DESCRIPTION,
  })
  currency!: string;

  @ApiProperty({
    type: Number,
    example: 15,
    description: messages.inventory.VALUED_ITEMS_DESCRIPTION,
  })
  valuedItems!: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: messages.inventory.CATEGORIES_COUNT_DESCRIPTION,
  })
  categories!: number;

  @ApiProperty({
    type: Number,
    example: 4,
    description: messages.inventory.ROOMS_COUNT_DESCRIPTION,
  })
  rooms!: number;
}