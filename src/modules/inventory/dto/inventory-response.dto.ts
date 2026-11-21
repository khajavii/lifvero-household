import { ApiProperty } from '@nestjs/swagger';

export class InventoryLookupDto {
  @ApiProperty() code!: string;
  @ApiProperty() translationKey!: string;
}

export class InventoryWarrantyDto extends InventoryLookupDto {
  @ApiProperty({ type: Number, nullable: true }) durationMonths!: number | null;
  @ApiProperty() isLifetime!: boolean;
}

export class InventoryItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) householdId!: string;
  @ApiProperty() itemName!: string;
  @ApiProperty() roomCode!: string;
  @ApiProperty() categoryCode!: string;
  @ApiProperty({ type: String, format: 'date', nullable: true }) purchaseDate!: string | null;
  @ApiProperty({ type: String, nullable: true }) warrantyCode!: string | null;
  @ApiProperty({ type: String, nullable: true, example: '199.99' }) purchaseAmount!: string | null;
  @ApiProperty({ type: String, nullable: true, example: 'USD' }) currency!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: Date;
}

export class InventoryPageDto {
  @ApiProperty({ type: [InventoryItemDto] }) items!: InventoryItemDto[];
  @ApiProperty({ type: Number, nullable: true }) nextOffset!: number | null;
}

export class InventorySummaryDto {
  @ApiProperty() totalItems!: number;
  @ApiProperty({ type: String, example: '199.99', description: 'Sum of known purchase amounts in the reporting currency' }) totalValue!: string;
  @ApiProperty({ example: 'USD' }) currency!: string;
  @ApiProperty({ description: 'Number of items included in totalValue, including items valued at zero' }) valuedItems!: number;
  @ApiProperty({ description: 'Number of distinct categories in my inventory' }) categories!: number;
  @ApiProperty({ description: 'Number of distinct room codes in my inventory' }) rooms!: number;
}
