import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  InvalidInventoryLookupError, InventoryItem, InventoryPageQuery, InventorySummary,
  InventoryWriteSettings, NewInventoryItem, PersonalInventoryRepository,
} from './inventory.repository';

// Both SELECT and INSERT use the same response projection.
const ITEM_COLUMNS = `i.id, i.household_id AS "householdId", i.item_name AS "itemName",
  i.room_code AS "roomCode", i.category_code AS "categoryCode",
  to_char(i.purchase_date, 'YYYY-MM-DD') AS "purchaseDate", i.warranty_code AS "warrantyCode",
  i.purchase_amount::text AS "purchaseAmount", i.currency,
  i.created_at AS "createdAt", i.updated_at AS "updatedAt"`;

// 'My inventory' means items I created in households where I am still a member.
const PERSONAL_SCOPE = `i.created_by = $1 AND EXISTS (
  SELECT 1 FROM household.household_members AS m
  WHERE m.household_id = i.household_id AND m.user_id = $1
)`;

@Injectable()
export class PostgresPersonalInventoryRepository implements PersonalInventoryRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  create(userId: string, input: NewInventoryItem, settings: InventoryWriteSettings): Promise<InventoryItem> {
    return this.db.transaction('READ COMMITTED', async (manager) => {
      // Serialize first saves for the same account across all running API instances.
      await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))', [userId]);
      const owned: { id: string }[] = await manager.query(
        `SELECT h.id FROM household.household_members AS m
          JOIN household.households AS h ON h.id = m.household_id
         WHERE m.user_id = $1 AND m.role = 'owner'
         ORDER BY h.created_at, h.id LIMIT 1 FOR SHARE OF h, m`, [userId],
      );
      let householdId = owned[0]?.id;
      if (!householdId) {
        const [home]: { id: string }[] = await manager.query(
          'INSERT INTO household.households (name) VALUES ($1) RETURNING id', [settings.householdName],
        );
        householdId = home.id;
        await manager.query(
          `INSERT INTO household.household_members (household_id, user_id, role) VALUES ($1, $2, 'owner')`,
          [householdId, userId],
        );
      }

      const [item]: InventoryItem[] = await manager.query(
        `INSERT INTO household.inventory_items AS i
           (household_id, item_name, room_code, category_code, purchase_date, warranty_code,
            created_by, purchase_amount, currency)
         SELECT $1::uuid, $2::varchar, $3::varchar, $4::varchar, $5::date, $6::varchar,
                $7::varchar, $8::numeric, $9::varchar
         WHERE EXISTS (SELECT 1 FROM household.inventory_rooms WHERE code = $3 AND is_active)
           AND EXISTS (SELECT 1 FROM household.inventory_categories WHERE code = $4 AND is_active)
           AND EXISTS (SELECT 1 FROM household.inventory_warranty_options WHERE code = $6 AND is_active)
         RETURNING ${ITEM_COLUMNS}`,
        [householdId, input.itemName, input.roomCode, input.categoryCode, input.purchaseDate,
          input.warrantyCode, userId, input.purchaseAmount ?? null,
          input.purchaseAmount === undefined ? null : settings.currency],
      );
      // Throw inside the transaction so an invalid first item does not leave an empty house.
      if (!item) throw new InvalidInventoryLookupError();
      return item;
    });
  }

  list(userId: string, page: InventoryPageQuery): Promise<InventoryItem[]> {
    return this.db.query(
      `SELECT ${ITEM_COLUMNS} FROM household.inventory_items AS i
       WHERE ${PERSONAL_SCOPE}
       ORDER BY i.created_at DESC, i.id DESC LIMIT $2 OFFSET $3`,
      [userId, page.limit + 1, page.offset],
    );
  }

  async summary(userId: string, currency: string): Promise<InventorySummary> {
    type Row = Record<'totalItems' | 'valuedItems' | 'categories' | 'rooms' | 'totalValue', string>;
    const [row]: Row[] = await this.db.query(
      `SELECT count(*) AS "totalItems", count(DISTINCT i.category_code) AS categories,
              count(DISTINCT i.room_code) AS rooms,
              count(i.purchase_amount) FILTER (WHERE i.currency = $2) AS "valuedItems",
              COALESCE(sum(i.purchase_amount) FILTER (WHERE i.currency = $2), 0.00)::text AS "totalValue"
         FROM household.inventory_items AS i WHERE ${PERSONAL_SCOPE}`,
      [userId, currency],
    );
    return {
      totalItems: Number(row.totalItems), totalValue: row.totalValue, currency,
      valuedItems: Number(row.valuedItems), categories: Number(row.categories), rooms: Number(row.rooms),
    };
  }
}
