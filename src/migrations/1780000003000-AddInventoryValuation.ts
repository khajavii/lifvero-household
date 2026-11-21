import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryValuation1780000003000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE household.inventory_items
        ADD COLUMN purchase_amount numeric(14,2),
        ADD COLUMN currency varchar(3),
        ADD CONSTRAINT inventory_items_valuation_check CHECK (
          (purchase_amount IS NULL AND currency IS NULL) OR
          (purchase_amount IS NOT NULL AND purchase_amount BETWEEN 0 AND 999999999999.99
           AND currency IS NOT NULL AND currency ~ '^[A-Z]{3}$')
        )
    `);
    await queryRunner.query(`
      CREATE INDEX inventory_items_creator_created_idx
        ON household.inventory_items (created_by, created_at DESC, id DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX household.inventory_items_creator_created_idx');
    await queryRunner.query(`
      ALTER TABLE household.inventory_items DROP CONSTRAINT inventory_items_valuation_check,
        DROP COLUMN currency, DROP COLUMN purchase_amount
    `);
  }
}
