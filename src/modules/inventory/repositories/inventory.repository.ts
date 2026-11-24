
import type { EntityManager } from 'typeorm';

/**
 * Defines the data required to create a new inventory item.
 */
export interface NewInventoryItem {
  /** The name of the inventory item. */
  itemName: string;

  /** The code identifying the room where the item is located. */
  roomCode: string;

  /** The code identifying the item's category. */
  categoryCode: string;

  /** The date when the item was purchased. */
  purchaseDate: string;

  /** The code identifying the item's warranty option. */
  warrantyCode: string;

  /** The purchase amount of the item. */
  purchaseAmount?: string;
}

/**
 * Represents a personal inventory item.
 */
export interface InventoryItem {
  /** The unique identifier of the inventory item. */
  id: string;

  /** The identifier of the household associated with the item. */
  householdId: string;

  /** The name of the inventory item. */
  itemName: string;

  /** The code identifying the item's room. */
  roomCode: string;

  /** The code identifying the item's category. */
  categoryCode: string;

  /** The purchase date, or null if not available. */
  purchaseDate: string | null;

  /** The warranty code, or null if no warranty is assigned. */
  warrantyCode: string | null;

  /** The purchase amount, or null if not provided. */
  purchaseAmount: string | null;

  /** The currency associated with the purchase amount, or null if unavailable. */
  currency: string | null;

  /** The date and time when the inventory item was created. */
  createdAt: Date;

  /** The date and time when the inventory item was last updated. */
  updatedAt: Date;
}

/**
 * Represents an aggregated summary of a user's personal inventory.
 */
export interface InventorySummary {
  /** The total number of inventory items. */
  totalItems: number;

  /** The combined purchase value of valued inventory items. */
  totalValue: string;

  /** The currency used for the inventory summary. */
  currency: string;

  /** The number of inventory items with a recorded purchase value. */
  valuedItems: number;

  /** The total number of distinct inventory categories. */
  categories: number;

  /** The total number of distinct inventory rooms. */
  rooms: number;
}

/**
 * Represents a general inventory lookup option.
 *
 * Used for categories and rooms.
 */
export interface InventoryLookup {
  /** The unique code identifying the lookup option. */
  code: string;

  /** The translation key used to localize the lookup label. */
  translationKey: string;
}

/**
 * Represents a warranty lookup option with additional warranty details.
 */
export interface WarrantyLookup extends InventoryLookup {
  /** The warranty duration in months, or null if not applicable. */
  durationMonths: number | null;

  /** Indicates whether the warranty provides lifetime coverage. */
  isLifetime: boolean;
}

/**
 * Defines the contract for retrieving inventory catalog data.
 *
 * Implementations are responsible for providing available inventory
 * categories, rooms, and warranty options.
 */
export abstract class InventoryCatalogRepository {
  /**
   * Retrieves available inventory categories.
   *
   * @returns A promise resolving to the list of inventory categories.
   */
  abstract categories(): Promise<InventoryLookup[]>;

  /**
   * Retrieves available inventory rooms.
   *
   * @returns A promise resolving to the list of inventory rooms.
   */
  abstract rooms(): Promise<InventoryLookup[]>;

  /**
   * Retrieves available warranty options.
   *
   * @returns A promise resolving to the list of warranty options.
   */
  abstract warranties(): Promise<WarrantyLookup[]>;
}

/**
 * Defines pagination and filter parameters for inventory queries.
 */
export interface InventoryPageQuery {
  /** The maximum number of inventory items to retrieve. */
  limit: number;

  /** The number of inventory items to skip. */
  offset: number;

  /** Optional search term matching item name. */
  search?: string;

  /** Optional filter by category code. */
  categoryCode?: string;
}

/**
 * Defines configuration settings used when creating inventory items.
 */
export interface InventoryWriteSettings {
  /** The identifier of the household to which the item belongs. */
  householdId: string;

  /** The identifier of the user who owns the inventory item. */
  userId: string;

  /** The currency used for inventory monetary values. */
  currency: string;
}

/**
 * Represents an error caused by an invalid or unavailable inventory lookup.
 *
 * Thrown when a selected room, category, or warranty does not exist
 * or is inactive.
 */
export class InvalidInventoryLookupError extends Error {}

/**
 * Defines the contract for managing users' personal inventory items.
 *
 * Implementations are responsible for creating, retrieving, and
 * summarizing inventory data associated with individual users.
 */
export abstract class PersonalInventoryRepository {
  /**
   * Creates a new inventory item within an active transaction.
   *
   * @param input - The inventory item creation data.
   * @param settings - The context settings including household ID, user ID, and currency.
   * @param manager - The entity manager associated with the active transaction.
   * @returns A promise resolving to the newly created inventory item.
   * @throws InvalidInventoryLookupError If a selected lookup option is invalid or inactive.
   */
  abstract create(
      input: NewInventoryItem,
      settings: InventoryWriteSettings,
      manager: EntityManager,
  ): Promise<InventoryItem>;

  /**
   * Counts total inventory items belonging to a user matching the query criteria.
   *
   * @param userId - The ID of the user whose inventory is being counted.
   * @param query - The filter criteria.
   * @returns A promise resolving to the total item count.
   */
  abstract count(
      userId: string,
      query?: Pick<InventoryPageQuery, 'search' | 'categoryCode'>,
  ): Promise<number>;

  /**
   * Retrieves a paginated list of inventory items belonging to a user.
   *
   * @param userId - The ID of the user whose inventory is being retrieved.
   * @param page - The pagination parameters.
   * @returns A promise resolving to the list of inventory items.
   */
  abstract list(
      userId: string,
      page: InventoryPageQuery,
  ): Promise<InventoryItem[]>;

  /**
   * Retrieves an aggregated inventory summary for a user.
   *
   * @param userId - The ID of the user whose inventory is being summarized.
   * @param currency - The currency used to calculate and format monetary values.
   * @returns A promise resolving to the inventory summary.
   */
  abstract summary(
      userId: string,
      currency: string,
  ): Promise<InventorySummary>;
}
