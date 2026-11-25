
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';
import { InventoryItemEntity } from '../entities/inventory-item.entity';
import {
  InventoryCategoryEntity,
  InventoryRoomEntity,
  InventoryWarrantyOptionEntity,
} from '../entities/inventory-lookups.entity';
import { HouseholdMemberEntity } from '../../household-members/entities/household-member.entity';
import { calculateWarrantyStatus, WarrantyStatus } from '../utils/warranty-status.util';
import {
  InvalidInventoryLookupError,
  InventoryItem,
  InventoryPageQuery,
  InventorySummary,
  InventoryWriteSettings,
  NewInventoryItem,
  PersonalInventoryRepository,
} from './inventory.repository';

/**
 * Represents the raw result returned by the inventory summary query.
 */
interface InventorySummaryRow {
  totalItems: string;
  valuedItems: string;
  categories: string;
  rooms: string;
  totalValue: string;
}

/**
 * Provides the shared inventory item response projection.
 *
 * Converts database column names into the InventoryItem response format.
 *
 * @param query - The TypeORM select query builder.
 * @returns The query builder with the inventory item projection.
 */
function selectInventoryColumns(
    query: SelectQueryBuilder<any>,
): SelectQueryBuilder<any> {
  return query
      .select('i.id', 'id')
      .addSelect('i.household_id', 'householdId')
      .addSelect('i.item_name', 'itemName')
      .addSelect('i.room_code', 'roomCode')
      .addSelect('i.category_code', 'categoryCode')
      .addSelect("TO_CHAR(i.purchase_date, 'YYYY-MM-DD')", 'purchaseDate')
      .addSelect('i.warranty_code', 'warrantyCode')
      .addSelect('i.purchase_amount::text', 'purchaseAmount')
      .addSelect('i.currency', 'currency')
      .addSelect('i.is_active', 'isActive')
      .addSelect('i.created_at', 'createdAt')
      .addSelect('i.updated_at', 'updatedAt')
      .addSelect('w.duration_months', 'warrantyDurationMonths')
      .addSelect('w.is_lifetime', 'warrantyIsLifetime');
}

/**
 * Maps raw query row to InventoryItem with calculated warranty status.
 *
 * @param row - The raw SQL row.
 * @returns InventoryItem domain object.
 */
function mapInventoryRow(row: any): InventoryItem {
  return {
    id: row.id,
    householdId: row.householdId,
    itemName: row.itemName,
    roomCode: row.roomCode,
    categoryCode: row.categoryCode,
    purchaseDate: row.purchaseDate,
    warrantyCode: row.warrantyCode,
    purchaseAmount: row.purchaseAmount,
    currency: row.currency,
    isActive: Boolean(row.isActive),
    warrantyStatus: calculateWarrantyStatus(
        row.purchaseDate,
        row.warrantyDurationMonths,
        row.warrantyIsLifetime,
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Implements personal inventory persistence using PostgreSQL and TypeORM.
 *
 * Provides transactional inventory creation, user-scoped pagination,
 * and aggregated inventory summaries.
 *
 * Inventory items are accessible only to their creator while that user
 * remains a member of the associated household.
 */
@Injectable()
export class PostgresPersonalInventoryRepository
    implements PersonalInventoryRepository
{
  /**
   * Initializes the personal inventory repository.
   *
   * @param db - The TypeORM data source used for database operations.
   */
  constructor(
      @InjectDataSource()
      private readonly db: DataSource,
  ) {}

  /**
   * Creates a new inventory item within an active transaction.
   *
   * Validates lookup references against active catalog options and inserts
   * the inventory item linked to the resolved household.
   *
   * @param input - The inventory item creation payload.
   * @param settings - The context settings including household ID, user ID, and currency.
   * @param manager - The transaction entity manager.
   * @returns A promise resolving to the created inventory item.
   * @throws InvalidInventoryLookupError If the selected room, category, or warranty does not exist or is inactive.
   */
  async create(
      input: NewInventoryItem,
      settings: InventoryWriteSettings,
      manager: EntityManager,
  ): Promise<InventoryItem> {
    await this.validateLookups(manager, input);

    const result = await manager
        .createQueryBuilder()
        .insert()
        .into(InventoryItemEntity)
        .values({
          householdId: settings.householdId,
          itemName: input.itemName,
          roomCode: input.roomCode,
          categoryCode: input.categoryCode,
          purchaseDate: input.purchaseDate,
          warrantyCode: input.warrantyCode,
          createdBy: settings.userId,
          purchaseAmount: input.purchaseAmount ?? null,
          currency: input.purchaseAmount !== undefined
              ? settings.currency
              : null,
        })
        .returning(['id'])
        .execute();

    const itemId = result.identifiers[0]?.id
        ?? result.raw[0]?.id;

    if (!itemId) {
      throw new Error('Failed to create inventory item');
    }

    const item = await this.findItemById(manager, itemId);

    if (!item) {
      throw new Error('Failed to retrieve the created inventory item');
    }

    return item;
  }

  /**
   * Counts total inventory items belonging to a user matching the query criteria.
   *
   * @param userId - The ID of the user whose inventory is being counted.
   * @param query - The filter criteria.
   * @returns A promise resolving to the total item count.
   */
  async count(
      userId: string,
      query?: Pick<InventoryPageQuery, 'search' | 'categoryCode'>,
  ): Promise<number> {
    const qb = this.db
        .createQueryBuilder()
        .from(InventoryItemEntity, 'i')
        .select('COUNT(*)::text', 'total');

    this.applyPersonalScope(qb, userId);
    this.applyFilters(qb, query);

    const result = await qb.getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  /**
   * Retrieves a paginated list of inventory items belonging to a user.
   *
   * Only items created by the specified user in households where
   * the user is still an active member are included.
   *
   * @param userId - The ID of the inventory owner.
   * @param page - The pagination limit, offset, and search filters.
   * @returns A promise resolving to the inventory items.
   */
  async list(
      userId: string,
      page: InventoryPageQuery,
  ): Promise<InventoryItem[]> {
    const query = selectInventoryColumns(
        this.db
            .createQueryBuilder()
            .from(InventoryItemEntity, 'i')
            .leftJoin(
                InventoryWarrantyOptionEntity,
                'w',
                'w.code = i.warranty_code',
            ),
    );

    this.applyPersonalScope(query, userId);
    this.applyFilters(query, page);

    const rows = await query
        .orderBy('i.created_at', 'DESC')
        .addOrderBy('i.id', 'DESC')
        .limit(page.limit)
        .offset(page.offset)
        .getRawMany();

    return rows.map(mapInventoryRow);
  }

  /**
   * Retrieves an inventory item by ID for the specified user.
   *
   * @param userId - The ID of the inventory owner.
   * @param itemId - The UUID of the inventory item.
   * @returns A promise resolving to the inventory item or null if not found.
   */
  async findById(
      userId: string,
      itemId: string,
  ): Promise<InventoryItem | null> {
    const query = selectInventoryColumns(
        this.db
            .createQueryBuilder()
            .from(InventoryItemEntity, 'i')
            .leftJoin(
                InventoryWarrantyOptionEntity,
                'w',
                'w.code = i.warranty_code',
            ),
    );

    this.applyPersonalScope(query, userId);

    const row = await query
        .andWhere('i.id = :itemId', { itemId })
        .getRawOne();

    return row ? mapInventoryRow(row) : null;
  }

  /**
   * Updates the active status of an inventory item.
   *
   * @param userId - The ID of the inventory owner.
   * @param itemId - The UUID of the inventory item.
   * @param isActive - The new active state.
   * @returns A promise resolving to the updated inventory item or null if not found.
   */
  async updateActiveStatus(
      userId: string,
      itemId: string,
      isActive: boolean,
  ): Promise<InventoryItem | null> {
    const item = await this.findById(userId, itemId);
    if (!item) {
      return null;
    }

    await this.db
        .createQueryBuilder()
        .update(InventoryItemEntity)
        .set({
          isActive,
          updatedAt: () => 'now()',
        })
        .where('id = :itemId', { itemId })
        .andWhere('createdBy = :userId', { userId })
        .execute();

    return this.findById(userId, itemId);
  }

  /**
   * Soft deletes an inventory item.
   *
   * @param userId - The ID of the inventory owner.
   * @param itemId - The UUID of the inventory item.
   * @returns A promise resolving to true if deleted, or false if not found.
   */
  async softDelete(
      userId: string,
      itemId: string,
  ): Promise<boolean> {
    const item = await this.findById(userId, itemId);
    if (!item) {
      return false;
    }

    const result = await this.db
        .createQueryBuilder()
        .update(InventoryItemEntity)
        .set({
          isActive: false,
          deletedAt: () => 'now()',
          updatedAt: () => 'now()',
        })
        .where('id = :itemId', { itemId })
        .andWhere('createdBy = :userId', { userId })
        .andWhere('deletedAt IS NULL')
        .execute();

    return (result.affected ?? 0) > 0;
  }

  /**
   * Retrieves an aggregated summary of a user's personal inventory.
   *
   * Monetary values are calculated only for items matching
   * the requested currency.
   *
   * @param userId - The ID of the inventory owner.
   * @param currency - The currency used for monetary aggregation.
   * @returns A promise resolving to the inventory summary.
   */
  async summary(
      userId: string,
      currency: string,
  ): Promise<InventorySummary> {
    const query = this.db
        .createQueryBuilder()
        .from(InventoryItemEntity, 'i')
        .select('COUNT(*)::text', 'totalItems')
        .addSelect(
            'COUNT(DISTINCT i.category_code)::text',
            'categories',
        )
        .addSelect(
            'COUNT(DISTINCT i.room_code)::text',
            'rooms',
        )
        .addSelect(
            `COUNT(i.purchase_amount) FILTER (
          WHERE i.currency = :currency
        )::text`,
            'valuedItems',
        )
        .addSelect(
            `COALESCE(
          SUM(i.purchase_amount) FILTER (
            WHERE i.currency = :currency
          ),
          0.00
        )::text`,
            'totalValue',
        )
        .setParameter('currency', currency);

    this.applyPersonalScope(query, userId);

    const row = await query.getRawOne<InventorySummaryRow>();

    return {
      totalItems: Number(row?.totalItems ?? 0),
      totalValue: row?.totalValue ?? '0.00',
      currency,
      valuedItems: Number(row?.valuedItems ?? 0),
      categories: Number(row?.categories ?? 0),
      rooms: Number(row?.rooms ?? 0),
    };
  }

  /**
   * Validates the room, category, and warranty selected for an inventory item.
   *
   * Each lookup must exist and be active before an inventory item
   * can be created.
   *
   * @param manager - The transaction entity manager.
   * @param input - The inventory item creation data.
   * @throws InvalidInventoryLookupError If any selected lookup is invalid or inactive.
   */
  private async validateLookups(
      manager: EntityManager,
      input: NewInventoryItem,
  ): Promise<void> {
    const lookups = [
      {
        entity: InventoryRoomEntity,
        code: input.roomCode,
      },
      {
        entity: InventoryCategoryEntity,
        code: input.categoryCode,
      },
      {
        entity: InventoryWarrantyOptionEntity,
        code: input.warrantyCode,
      },
    ];

    for (const lookup of lookups) {
      const exists = await manager
          .getRepository(lookup.entity)
          .createQueryBuilder('lookup')
          .select('1', 'exists')
          .where('lookup.code = :code', { code: lookup.code })
          .andWhere('lookup.isActive = TRUE')
          .getRawOne();

      if (!exists) {
        throw new InvalidInventoryLookupError();
      }
    }
  }

  /**
   * Retrieves an inventory item by its unique identifier.
   *
   * Uses the shared inventory response projection to maintain
   * a consistent response structure.
   *
   * @param manager - The transaction entity manager.
   * @param itemId - The unique inventory item identifier.
   * @returns A promise resolving to the inventory item, or null if not found.
   */
  private async findItemById(
      manager: EntityManager,
      itemId: string,
  ): Promise<InventoryItem | null> {
    const query = selectInventoryColumns(
        manager
            .createQueryBuilder()
            .from(InventoryItemEntity, 'i')
            .leftJoin(
                InventoryWarrantyOptionEntity,
                'w',
                'w.code = i.warranty_code',
            ),
    );

    const row = await query
        .where('i.id = :itemId', { itemId })
        .getRawOne();

    return row ? mapInventoryRow(row) : null;
  }

  /**
   * Applies the personal inventory access restrictions to a query.
   *
   * An inventory item must have been created by the specified user,
   * not soft-deleted, and the user must still be a member of its associated household.
   *
   * @param query - The inventory query builder.
   * @param userId - The ID of the inventory owner.
   * @returns The query builder with the personal inventory restrictions.
   */
  private applyPersonalScope(
      query: SelectQueryBuilder<any>,
      userId: string,
  ): SelectQueryBuilder<any> {
    const membershipQuery = query
        .subQuery()
        .select('1')
        .from(HouseholdMemberEntity, 'm')
        .where('m.householdId = i.household_id')
        .andWhere('m.userId = :userId')
        .getQuery();

    return query
        .where('i.created_by = :userId', { userId })
        .andWhere('i.deleted_at IS NULL')
        .andWhere(`EXISTS ${membershipQuery}`)
        .setParameter('userId', userId);
  }

  /**
   * Applies optional search and category filters to the inventory query.
   *
   * @param query - The query builder instance.
   * @param filters - The search and category filter criteria.
   */
  private applyFilters(
      query: SelectQueryBuilder<any>,
      filters?: Pick<InventoryPageQuery, 'search' | 'categoryCode'>,
  ): void {
    if (!filters) {
      return;
    }

    if (filters.search && filters.search.trim().length > 0) {
      query.andWhere('i.item_name ILIKE :search', {
        search: `%${filters.search.trim()}%`,
      });
    }

    if (filters.categoryCode && filters.categoryCode.trim().length > 0) {
      query.andWhere('i.category_code = :categoryCode', {
        categoryCode: filters.categoryCode.trim(),
      });
    }
  }
}
