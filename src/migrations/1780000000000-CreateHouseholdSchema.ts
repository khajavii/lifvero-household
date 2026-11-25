import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the dedicated `household` schema and core membership tables.
 */
export class CreateHouseholdSchema1780000000000
  implements MigrationInterface
{
  /**
   * Executes the migration schema definition queries.
   *
   * @param queryRunner - TypeORM query runner.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SCHEMA household
    `);

    await queryRunner.query(`
      REVOKE ALL ON SCHEMA household
      FROM PUBLIC, anon, authenticated
    `);

    await queryRunner.query(`
      CREATE FUNCTION household.set_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$
    `);

    await queryRunner.query(`
      CREATE TABLE household.households (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

        name varchar(100) NOT NULL,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT households_name_not_blank
          CHECK (length(btrim(name)) > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE household.household_members (
        household_id uuid NOT NULL,

        user_id varchar(255) NOT NULL,

        role varchar(20) NOT NULL DEFAULT 'member',

        created_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT household_members_pk
          PRIMARY KEY (household_id, user_id),

        CONSTRAINT household_members_household_fk
          FOREIGN KEY (household_id)
          REFERENCES household.households(id)
          ON DELETE CASCADE,

        CONSTRAINT household_members_user_not_blank
          CHECK (length(btrim(user_id)) > 0),

        CONSTRAINT household_members_role_check
          CHECK (role IN ('owner', 'member'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX household_members_user_id_idx
      ON household.household_members(user_id)
    `);

    await queryRunner.query(`
      CREATE TRIGGER households_set_updated_at
      BEFORE UPDATE ON household.households
      FOR EACH ROW
      EXECUTE FUNCTION household.set_updated_at()
    `);

    await queryRunner.query(`
      REVOKE ALL ON TABLE
        household.households,
        household.household_members
      FROM PUBLIC, anon, authenticated
    `);
  }

  /**
   * Reverts changes made in the up migration.
   *
   * @param queryRunner - TypeORM query runner.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE household.household_members
    `);

    await queryRunner.query(`
      DROP TABLE household.households
    `);

    await queryRunner.query(`
      DROP FUNCTION household.set_updated_at()
    `);

    await queryRunner.query(`
      DROP SCHEMA household
    `);
  }
}
