
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { inventoryConfig } from './config/inventory.config';

import { InventoryItemEntity } from './entities/inventory-item.entity';
import {
  InventoryCategoryEntity,
  InventoryRoomEntity,
  InventoryWarrantyOptionEntity,
} from './entities/inventory-lookups.entity';

import {
  InventoryCatalogController,
  PersonalInventoryController,
} from './inventory.controller';

import {
  InventoryCatalogService,
  PersonalInventoryService,
} from './inventory.service';

import {
  InventoryCatalogRepository,
  PersonalInventoryRepository,
} from './repositories/inventory.repository';

import { PostgresInventoryCatalogRepository } from './repositories/postgres-inventory-catalog.repository';
import { PostgresPersonalInventoryRepository } from './repositories/postgres-personal-inventory.repository';

import {
  InventoryAccountGuard,
  InventoryJwtGuard,
  InventoryJwtStrategy,
} from './security/inventory-auth';

/**
 * Provides inventory catalog and personal inventory functionality.
 *
 * Handles inventory operations, database access, and authentication
 * protection for inventory endpoints.
 */
@Module({
  imports: [
    ConfigModule.forFeature(inventoryConfig),

    PassportModule.register({
      session: false,
    }),

    TypeOrmModule.forFeature([
      InventoryItemEntity,
      InventoryCategoryEntity,
      InventoryRoomEntity,
      InventoryWarrantyOptionEntity,
    ]),
  ],
  controllers: [
    InventoryCatalogController,
    PersonalInventoryController,
  ],
  providers: [
    InventoryCatalogService,
    PersonalInventoryService,

    InventoryJwtStrategy,
    InventoryJwtGuard,
    InventoryAccountGuard,

    {
      provide: InventoryCatalogRepository,
      useClass: PostgresInventoryCatalogRepository,
    },
    {
      provide: PersonalInventoryRepository,
      useClass: PostgresPersonalInventoryRepository,
    },
  ],
  exports: [
    InventoryCatalogService,
    PersonalInventoryService,
  ],
})
export class InventoryModule {}
