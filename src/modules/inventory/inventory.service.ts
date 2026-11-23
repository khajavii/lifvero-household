import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource } from 'typeorm';
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

/** Provides read-only access to active inventory catalog options. */
@Injectable()
export class InventoryCatalogService {
  constructor(
      @Inject(InventoryCatalogRepository)
      private readonly catalog: InventoryCatalogRepository,
  ) {}

  /** Returns active inventory categories. */
  categories(): Promise<InventoryLookup[]> {
    return this.catalog.categories();
  }

  /** Returns active inventory rooms. */
  rooms(): Promise<InventoryLookup[]> {
    return this.catalog.rooms();
  }

  /** Returns active warranty options. */
  warranties(): Promise<WarrantyLookup[]> {
    return this.catalog.warranties();
  }
}

/** A page of personal inventory items and its continuation offset. */
export interface PersonalInventoryPage {
  items: InventoryItem[];
  nextOffset: number | null;
}

/** Coordinates account-scoped inventory use cases. */
@Injectable()
export class PersonalInventoryService {
  constructor(
      @Inject(PersonalInventoryRepository)
      private readonly items: PersonalInventoryRepository,
      private readonly households: HouseholdsService,
      @InjectDataSource()
      private readonly db: DataSource,
      @Inject(inventoryConfig.KEY)
      private readonly config: ConfigType<typeof inventoryConfig>,
  ) {}

  /**
   * Resolves the account's household and inserts an item atomically.
   *
   * This service owns the transaction. Both repositories receive the same
   * manager and must not open separate transactions for this use case.
   * Errors are mapped only after TypeORM has completed the rollback.
   *
   * @param userId - The account ID supplied by the authenticated controller.
   * @param item - The validated request body.
   * @returns The created item after the transaction commits.
   * @throws BadRequestException If a selected catalog option is invalid.
   */
  async create(
      userId: string,
      item: CreateInventoryItemDto,
  ): Promise<InventoryItem> {
    try {
      return await this.db.transaction('READ COMMITTED', async (tx) => {
        const householdId = await this.households.resolveOwnedHouseholdId(
            userId,
            tx,
        );

        return this.items.create(
            item,
            { householdId, userId, currency: this.config.currency },
            tx,
        );
      });
    } catch (error) {
      if (error instanceof InvalidInventoryLookupError) {
        throw new BadRequestException(messages.inventory.INVALID_LOOKUP);
      }

      throw error;
    }
  }

  /**
   * Returns a page of the user's personal inventory.
   *
   * @throws BadRequestException If the pagination bounds are invalid.
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

    const rows = await this.items.list(userId, { limit, offset });

    return {
      items: rows.slice(0, limit),
      nextOffset: rows.length > limit ? offset + limit : null,
    };
  }

  /** Returns the user's inventory totals in the configured reporting currency. */
  summary(userId: string): Promise<InventorySummary> {
    return this.items.summary(userId, this.config.currency);
  }
}
