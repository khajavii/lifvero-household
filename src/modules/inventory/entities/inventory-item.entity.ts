import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'household', name: 'inventory_items', synchronize: false })
export class InventoryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'household_id', type: 'uuid' })
  householdId!: string;

  @Column({ name: 'item_name', type: 'varchar', length: 150 })
  itemName!: string;

  @Column({ name: 'room_code', type: 'varchar', length: 40 })
  roomCode!: string;

  @Column({ name: 'category_code', type: 'varchar', length: 40 })
  categoryCode!: string;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate!: string | null;

  @Column({ name: 'warranty_code', type: 'varchar', length: 40, nullable: true })
  warrantyCode!: string | null;

  @Column({ name: 'purchase_amount', type: 'numeric', precision: 14, scale: 2, nullable: true })
  purchaseAmount!: string | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency!: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}
