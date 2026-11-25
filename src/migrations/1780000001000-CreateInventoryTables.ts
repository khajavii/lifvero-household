import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create tables for rooms, categories, warranty options, and inventory items.
 */
export class CreateInventoryTables1780000001000
    implements MigrationInterface
{
  /**
   * Executes the table creation queries and constraints.
   *
   * @param queryRunner - TypeORM query runner.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE household.inventory_rooms (
                                               id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                               code varchar(40) NOT NULL UNIQUE,
                                               translation_key varchar(50) NOT NULL UNIQUE,
                                               sort_order smallint NOT NULL,
                                               is_active boolean NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE household.inventory_categories (
                                                    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                    code varchar(40) NOT NULL UNIQUE,
                                                    translation_key varchar(50) NOT NULL UNIQUE,
                                                    sort_order smallint NOT NULL,
                                                    is_active boolean NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(`
      CREATE TABLE household.inventory_warranty_options (
                                                          id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                                          code varchar(40) NOT NULL UNIQUE,
                                                          translation_key varchar(50) NOT NULL UNIQUE,
                                                          duration_months smallint,
                                                          is_lifetime boolean NOT NULL DEFAULT false,
                                                          sort_order smallint NOT NULL,
                                                          is_active boolean NOT NULL DEFAULT true,

                                                          CONSTRAINT warranty_duration_check
                                                            CHECK (
                                                              (is_lifetime = true AND duration_months IS NULL)
                                                                OR
                                                              (
                                                                is_lifetime = false
                                                                  AND duration_months IS NOT NULL
                                                                  AND duration_months >= 0
                                                                )
                                                              )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE household.inventory_items (
                                               id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                                               household_id uuid NOT NULL,
                                               item_name varchar(150) NOT NULL,
                                               room_code varchar(40) NOT NULL,
                                               category_code varchar(40) NOT NULL,
                                               purchase_date date,
                                               warranty_code varchar(40),
                                               created_by varchar(255) NOT NULL,
                                               created_at timestamptz NOT NULL DEFAULT now(),
                                               updated_at timestamptz NOT NULL DEFAULT now(),

                                               CONSTRAINT inventory_items_household_fk
                                                 FOREIGN KEY (household_id)
                                                   REFERENCES household.households(id)
                                                   ON DELETE CASCADE,

                                               CONSTRAINT inventory_items_room_fk
                                                 FOREIGN KEY (room_code)
                                                   REFERENCES household.inventory_rooms(code),

                                               CONSTRAINT inventory_items_category_fk
                                                 FOREIGN KEY (category_code)
                                                   REFERENCES household.inventory_categories(code),

                                               CONSTRAINT inventory_items_warranty_fk
                                                 FOREIGN KEY (warranty_code)
                                                   REFERENCES household.inventory_warranty_options(code),

                                               CONSTRAINT inventory_items_name_not_blank
                                                 CHECK (length(btrim(item_name)) > 0),

                                               CONSTRAINT inventory_items_creator_not_blank
                                                 CHECK (length(btrim(created_by)) > 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX inventory_items_household_created_idx
        ON household.inventory_items (household_id, created_at DESC, id DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX inventory_items_household_room_idx
        ON household.inventory_items (household_id, room_code)
    `);

    await queryRunner.query(`
      CREATE INDEX inventory_items_household_category_idx
        ON household.inventory_items (household_id, category_code)
    `);

    await queryRunner.query(`
      CREATE TRIGGER inventory_items_set_updated_at
      BEFORE UPDATE ON household.inventory_items
      FOR EACH ROW
      EXECUTE FUNCTION household.set_updated_at()
    `);

    await queryRunner.query(`
      REVOKE ALL ON TABLE
        household.inventory_rooms,
        household.inventory_categories,
        household.inventory_warranty_options,
        household.inventory_items
      FROM PUBLIC, anon, authenticated
    `);
  }

  /**
   * Drops all inventory tables in reverse dependency order.
   *
   * @param queryRunner - TypeORM query runner.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE household.inventory_items`);
    await queryRunner.query(`DROP TABLE household.inventory_warranty_options`);
    await queryRunner.query(`DROP TABLE household.inventory_categories`);
    await queryRunner.query(`DROP TABLE household.inventory_rooms`);
  }
}
