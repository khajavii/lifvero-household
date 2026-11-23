import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Base columns for inventory catalog lookup entities.
 */
export abstract class InventoryLookupColumns {
  /** The unique lookup code identifying the catalog item. */
  @PrimaryColumn({ type: 'varchar', length: 40 })
  code!: string;

  /** The i18n translation key for displaying localized names. */
  @Column({ name: 'translation_key', type: 'varchar', length: 100 })
  translationKey!: string;

  /** Indicates whether the lookup option is actively available. */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

/**
 * Represents a room option in the inventory catalog.
 */
@Entity({ schema: 'household', name: 'inventory_rooms', synchronize: false })
export class InventoryRoomEntity extends InventoryLookupColumns {}

/**
 * Represents an item category option in the inventory catalog.
 */
@Entity({ schema: 'household', name: 'inventory_categories', synchronize: false })
export class InventoryCategoryEntity extends InventoryLookupColumns {}

/**
 * Represents a warranty duration or coverage option in the inventory catalog.
 */
@Entity({ schema: 'household', name: 'inventory_warranty_options', synchronize: false })
export class InventoryWarrantyOptionEntity extends InventoryLookupColumns {
  /** The warranty duration in months, or null if indefinite or not applicable. */
  @Column({ name: 'duration_months', type: 'int', nullable: true })
  durationMonths!: number | null;

  /** Indicates whether the warranty option provides lifetime coverage. */
  @Column({ name: 'is_lifetime', type: 'boolean', default: false })
  isLifetime!: boolean;
}
