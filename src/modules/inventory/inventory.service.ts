
import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';

import { messages } from '../../messages';
import { HouseholdsService } from '../households/households.service';
import { inventoryConfig } from './config/inventory.config';

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
 * Represents a paginated collection of personal inventory items.
 */
export interface PersonalInventoryPage {
  items: InventoryItem[];
  nextOffset: number | null;
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
   * Retrieves a paginated list of the user's inventory items.
   *
   * The repository fetches one additional record to determine
   * whether another page is available.
   *
   * @param userId - The authenticated account identifier.
   * @param query - Pagination parameters.
   * @returns The requested inventory page and its continuation offset.
   * @throws BadRequestException When pagination bounds are invalid.
   */
  async list(
      userId: string,
      query: InventoryPageQueryDto,
  ): Promise<PersonalInventoryPage> {
    const limit = query.limit ?? this.config.pageSize;
    const offset = query.offset ?? 0;

    if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > this.config.maxPageSize ||
        !Number.isSafeInteger(offset) ||
        offset < 0 ||
        !Number.isSafeInteger(offset + limit)
    ) {
      throw new BadRequestException(
          messages.inventory.INVALID_PAGINATION_BOUNDS,
      );
    }

    const rows = await this.items.list(userId, {
      limit: limit + 1,
      offset,
    });

    const hasNextPage = rows.length > limit;

    return {
      items: rows.slice(0, limit),
      nextOffset: hasNextPage ? offset + limit : null,
    };
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
