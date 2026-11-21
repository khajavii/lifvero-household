import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryCategoryEntity, InventoryRoomEntity, InventoryWarrantyOptionEntity } from '../entities/inventory-lookups.entity';
import { InventoryCatalogRepository } from './inventory.repository';

@Injectable()
export class PostgresInventoryCatalogRepository implements InventoryCatalogRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  categories() {
    return this.db.getRepository(InventoryCategoryEntity).find({
      select: { code: true, translationKey: true },
      where: { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  rooms() {
    return this.db.getRepository(InventoryRoomEntity).find({
      select: { code: true, translationKey: true },
      where: { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }

  warranties() {
    return this.db.getRepository(InventoryWarrantyOptionEntity).find({
      select: { code: true, translationKey: true, durationMonths: true, isLifetime: true },
      where: { isActive: true },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
  }
}
