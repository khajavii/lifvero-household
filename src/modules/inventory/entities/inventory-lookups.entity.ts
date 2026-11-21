import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

abstract class InventoryLookupColumns {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column({ type: 'varchar', length: 40, unique: true })
  code!: string;

  @Column({ name: 'translation_key', type: 'varchar', length: 50, unique: true })
  translationKey!: string;

  @Column({ name: 'sort_order', type: 'smallint' })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}

@Entity({ schema: 'household', name: 'inventory_rooms', synchronize: false })
export class InventoryRoomEntity extends InventoryLookupColumns {}

@Entity({ schema: 'household', name: 'inventory_categories', synchronize: false })
export class InventoryCategoryEntity extends InventoryLookupColumns {}

@Entity({ schema: 'household', name: 'inventory_warranty_options', synchronize: false })
export class InventoryWarrantyOptionEntity extends InventoryLookupColumns {
  @Column({ name: 'duration_months', type: 'smallint', nullable: true })
  durationMonths!: number | null;

  @Column({ name: 'is_lifetime', type: 'boolean', default: false })
  isLifetime!: boolean;
}
