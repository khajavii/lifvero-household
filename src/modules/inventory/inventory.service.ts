
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';

import { messages } from '../../messages';
import { HouseholdsService } from '../households/households.service';
import { inventoryConfig } from './config/inventory.config';
import { PaginationResource } from '../../common/pagination';

import type {
  CreateInventoryItemDto,
  InventoryPageQueryDto,
} from './dto/inventory.dto';

import {
  InvalidInventoryLookupError,
  InventoryCatalogRepository,
  PersonalInventoryRepository,
} from './repositories/inventory.repository';

import type {
  InventoryItem,
  InventoryLookup,
  InventorySummary,
  WarrantyLookup,
} from './repositories/inventory.repository';

/**
 * Provides read-only access to active inventory catalog options.
 */
@Injectable()
export class InventoryCatalogService {
  constructor(
      private readonly catalog: InventoryCatalogRepository,
  ) {}

  /**
   * Returns active inventory categories.
   *
   * @returns A list of active inventory categories.
   */
  categories(): Promise<InventoryLookup[]> {
    return this.catalog.categories();
  }

  /**
   * Returns active inventory rooms.
   *
   * @returns A list of active inventory rooms.
   */
  rooms(): Promise<InventoryLookup[]> {
    return this.catalog.rooms();
  }

  /**
   * Returns active warranty options.
   *
   * @returns A list of available warranty options.
   */
  warranties(): Promise<WarrantyLookup[]> {
    return this.catalog.warranties();
  }
}

/**
 * Represents a paginated collection of personal inventory items in Laravel resource style.
 */
export interface PersonalInventoryPage {
  result: InventoryItem[];
  pagination: PaginationResource;
}

/**
 * Coordinates account-scoped personal inventory operations.
 *
 * This service owns inventory creation transactions and ensures that
 * household resolution and inventory persistence use the same
 * TypeORM transaction manager.
 */
@Injectable()
export class PersonalInventoryService {
  constructor(
      private readonly items: PersonalInventoryRepository,
      private readonly households: HouseholdsService,
      @InjectDataSource()
      private readonly db: DataSource,
      @Inject(inventoryConfig.KEY)
      private readonly config: ConfigType<typeof inventoryConfig>,
  ) {}

  /**
   * Creates a personal inventory item within an atomic transaction.
   *
   * Household ownership is resolved before inserting the inventory item.
   * Both operations use the same transaction manager to guarantee
   * consistency and prevent partial writes.
   *
   * @param userId - The authenticated account identifier.
   * @param item - The validated inventory creation payload.
   * @returns The created inventory item after the transaction commits.
   * @throws BadRequestException When a catalog lookup is invalid.
   */
  async create(
      userId: string,
      item: CreateInventoryItemDto,
  ): Promise<InventoryItem> {
    try {
      return await this.db.transaction(
          'READ COMMITTED',
          async (tx: EntityManager): Promise<InventoryItem> => {
            const householdId =
                await this.households.resolveOwnedHouseholdId(
                    userId,
                    tx,
                );

            return this.items.create(
                item,
                {
                  householdId,
                  userId,
                  currency: this.config.currency,
                },
                tx,
            );
          },
      );
    } catch (error: unknown) {
      if (error instanceof InvalidInventoryLookupError) {
        throw new BadRequestException(
            messages.inventory.INVALID_LOOKUP,
        );
      }

      throw error;
    }
  }

  /**
   * Retrieves a paginated list of the user's inventory items with search and category filtering.
   *
   * Supports both page-based and offset-based pagination.
   *
   * @param userId - The authenticated account identifier.
   * @param query - Pagination parameters and filters.
   * @returns The requested inventory page and pagination meta in Laravel resource style.
   * @throws BadRequestException When pagination bounds are invalid.
   */
  async list(
      userId: string,
      query: InventoryPageQueryDto,
  ): Promise<PersonalInventoryPage> {
    const limit = query.limit ?? this.config.pageSize;
    const page = query.page ?? (query.offset !== undefined ? Math.floor(query.offset / limit) + 1 : 1);
    const offset = query.offset ?? (page - 1) * limit;

    if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > this.config.maxPageSize ||
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(offset) ||
        offset < 0 ||
        !Number.isSafeInteger(offset + limit)
    ) {
      throw new BadRequestException(
          messages.inventory.INVALID_PAGINATION_BOUNDS,
      );
    }

    const filterCriteria = {
      search: query.search,
      categoryCode: query.categoryCode,
    };

    const [items, total] = await Promise.all([
      this.items.list(userId, {
        limit,
        offset,
        ...filterCriteria,
      }),
      this.items.count(userId, filterCriteria),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      result: items,
      pagination: PaginationResource.make({
        currentPage: page,
        totalPages,
        perPage: limit,
        total,
      }),
    };
  }

  /**
   * Retrieves an inventory item by ID ensuring it belongs to the user.
   *
   * @param userId - The authenticated account identifier.
   * @param itemId - The UUID of the inventory item.
   * @returns The requested inventory item.
   * @throws NotFoundException When the item does not exist or does not belong to the user.
   */
  async findById(userId: string, itemId: string): Promise<InventoryItem> {
    const item = await this.items.findById(userId, itemId);
    if (!item) {
      throw new NotFoundException(messages.inventory.ITEM_NOT_FOUND);
    }
    return item;
  }

  /**
   * Updates the active status of an inventory item.
   *
   * @param userId - The authenticated account identifier.
   * @param itemId - The UUID of the inventory item.
   * @param isActive - The new active status.
   * @returns The updated inventory item.
   * @throws NotFoundException When the item does not exist or does not belong to the user.
   */
  async updateStatus(
      userId: string,
      itemId: string,
      isActive: boolean,
  ): Promise<InventoryItem> {
    const item = await this.items.updateActiveStatus(userId, itemId, isActive);
    if (!item) {
      throw new NotFoundException(messages.inventory.ITEM_NOT_FOUND);
    }
    return item;
  }

  /**
   * Soft deletes an inventory item for the user.
   *
   * The item remains in the database with deleted_at set and is_active false.
   *
   * @param userId - The authenticated account identifier.
   * @param itemId - The UUID of the inventory item.
   * @returns A boolean indicating successful deletion.
   * @throws NotFoundException When the item does not exist or does not belong to the user.
   */
  async delete(userId: string, itemId: string): Promise<boolean> {
    const deleted = await this.items.softDelete(userId, itemId);
    if (!deleted) {
      throw new NotFoundException(messages.inventory.ITEM_NOT_FOUND);
    }
    return true;
  }

  /**
   * Returns the user's inventory totals in the configured currency.
   *
   * @param userId - The authenticated account identifier.
   * @returns The inventory summary.
   */
  summary(userId: string): Promise<InventorySummary> {
    return this.items.summary(
        userId,
        this.config.currency,
    );
  }
}
