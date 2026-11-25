import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  InventoryCategoryEntity,
  InventoryRoomEntity,
  InventoryWarrantyOptionEntity,
} from '../entities/inventory-lookups.entity';
import {
  InventoryCatalogRepository,
  InventoryLookup,
  WarrantyLookup,
} from './inventory.repository';

/**
 * PostgreSQL implementation of the inventory catalog repository.
 *
 * Provides access to available catalog lookup records including rooms,
 * categories, and warranty options using TypeORM entity repositories.
 */
@Injectable()
export class PostgresInventoryCatalogRepository
  implements InventoryCatalogRepository
{
  /**
   * Initializes the repository with the application data source.
   *
   * @param db - The TypeORM data source instance.
   */
  constructor(
    @InjectDataSource()
    private readonly db: DataSource,
  ) {}

  /**
   * Retrieves all active inventory categories ordered alphabetically by code.
   *
   * @returns A promise resolving to the list of active categories.
   */
  async categories(): Promise<InventoryLookup[]> {
    return this.db.getRepository(InventoryCategoryEntity).find({
      select: { code: true, translationKey: true },
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  /**
   * Retrieves all active inventory rooms ordered alphabetically by code.
   *
   * @returns A promise resolving to the list of active rooms.
   */
  async rooms(): Promise<InventoryLookup[]> {
    return this.db.getRepository(InventoryRoomEntity).find({
      select: { code: true, translationKey: true },
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  /**
   * Retrieves all active warranty options ordered alphabetically by code.
   *
   * @returns A promise resolving to the list of active warranty options.
   */
  async warranties(): Promise<WarrantyLookup[]> {
    return this.db.getRepository(InventoryWarrantyOptionEntity).find({
      select: {
        code: true,
        translationKey: true,
        durationMonths: true,
        isLifetime: true,
      },
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }
}

