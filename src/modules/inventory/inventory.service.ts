
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { inventoryConfig } from './config/inventory.config';
import { CreateInventoryItemDto, InventoryPageQueryDto } from './dto/inventory.dto';
import {
  InvalidInventoryLookupError,
  InventoryCatalogRepository,
  PersonalInventoryRepository,
} from './repositories/inventory.repository';
import {messages} from "../../messages";

/**
 * Provides access to inventory catalog data.
 *
 * Handles retrieval of available inventory categories, rooms, and warranty options.
 */
@Injectable()
export class InventoryCatalogService {
  constructor(
      private readonly catalog: InventoryCatalogRepository,
  ) {}

  /**
   * Retrieves all available inventory categories.
   *
   * @returns A list of active inventory categories.
   */
  categories() {
    return this.catalog.categories();
  }

  /**
   * Retrieves all available inventory rooms.
   *
   * @returns A list of active inventory rooms.
   */
  rooms() {
    return this.catalog.rooms();
  }

  /**
   * Retrieves all available warranty options.
   *
   * @returns A list of active warranty options.
   */
  warranties() {
    return this.catalog.warranties();
  }
}

/**
 * Manages personal inventory items for authenticated users.
 *
 * Provides operations for creating, listing, and retrieving summaries
 * of a user's inventory.
 */
@Injectable()
export class PersonalInventoryService {
  constructor(
      private readonly items: PersonalInventoryRepository,
      @Inject(inventoryConfig.KEY)
      private readonly config: ConfigType<typeof inventoryConfig>,
  ) {}

  /**
   * Creates a new inventory item for the specified user.
   *
   * @param userId - The ID of the authenticated user.
   * @param item - The inventory item creation data.
   * @returns The newly created inventory item.
   * @throws BadRequestException If a selected lookup is invalid.
   */
  async create(userId: string, item: CreateInventoryItemDto) {
    try {
      return await this.items.create(userId, item, {
        householdName: this.config.householdName,
        currency: this.config.currency,
      });
    } catch (error) {
      if (error instanceof InvalidInventoryLookupError) {
        throw new BadRequestException(
            messages.inventory.INVALID_LOOKUP,
        );
      }

      throw error;
    }
  }

  /**
   * Retrieves a paginated list of inventory items belonging to a user.
   *
   * @param userId - The ID of the authenticated user.
   * @param query - Pagination parameters.
   * @returns The inventory items and the next offset.
   * @throws BadRequestException If pagination bounds are invalid.
   */
  async list(userId: string, query: InventoryPageQueryDto) {
    const limit = query.limit ?? this.config.pageSize;
    const offset = query.offset ?? 0;

    if (
        limit > this.config.maxPageSize ||
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

  /**
   * Retrieves an aggregated summary of a user's personal inventory.
   *
   * @param userId - The ID of the authenticated user.
   * @returns The inventory summary.
   */
  summary(userId: string) {
    return this.items.summary(userId, this.config.currency);
  }
}