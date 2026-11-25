import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add soft-delete and active state columns to household.inventory_items table.
 */
export class AddInventoryItemsSoftDeleteAndStatus1795512571943 implements MigrationInterface {
  /**
   * Adds `is_active` and `deleted_at` columns along with composite filtering index.
   *
   * @param queryRunner - TypeORM query runner.
   */
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE household.inventory_items
        ADD COLUMN is_active boolean NOT NULL DEFAULT true,
        ADD COLUMN deleted_at timestamptz NULL
    `);

    await queryRunner.query(`
      CREATE INDEX inventory_items_active_not_deleted_idx
        ON household.inventory_items (created_by, is_active, deleted_at)
    `);
  }

  /**
   * Reverts soft-delete index and columns.
   *
   * @param queryRunner - TypeORM query runner.
   */
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX household.inventory_items_active_not_deleted_idx');
    await queryRunner.query(`
      ALTER TABLE household.inventory_items
        DROP COLUMN deleted_at,
        DROP COLUMN is_active
    `);
  }
}
