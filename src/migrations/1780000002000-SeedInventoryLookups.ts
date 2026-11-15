import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInventoryLookups1780000002000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO household.inventory_rooms
        (code, translation_key, sort_order)
      VALUES
        ('living-room', 'livingRoom', 1),
        ('bedroom', 'bedroom', 2),
        ('kitchen', 'kitchen', 3),
        ('bathroom', 'bathroom', 4),
        ('dining-room', 'diningRoom', 5),
        ('office', 'office', 6),
        ('garage', 'garage', 7),
        ('basement', 'basement', 8),
        ('attic', 'attic', 9),
        ('other', 'other', 10)
    `);

    await queryRunner.query(`
      INSERT INTO household.inventory_categories
        (code, translation_key, sort_order)
      VALUES
        ('electronics', 'electronics', 1),
        ('furniture', 'furniture', 2),
        ('appliances', 'appliances', 3),
        ('clothing', 'clothing', 4),
        ('jewelry', 'jewelry', 5),
        ('documents', 'documents', 6),
        ('tools', 'tools', 7),
        ('other', 'other', 8)
    `);

    await queryRunner.query(`
      INSERT INTO household.inventory_warranty_options
        (
          code,
          translation_key,
          duration_months,
          is_lifetime,
          sort_order
        )
      VALUES
        ('none', 'none', 0, false, 1),
        ('one-year', 'oneYear', 12, false, 2),
        ('two-years', 'twoYears', 24, false, 3),
        ('three-years', 'threeYears', 36, false, 4),
        ('lifetime', 'lifetime', NULL, true, 5)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM household.inventory_warranty_options
      WHERE code IN (
        'none',
        'one-year',
        'two-years',
        'three-years',
        'lifetime'
      )
    `);

    await queryRunner.query(`
      DELETE FROM household.inventory_categories
      WHERE code IN (
        'electronics',
        'furniture',
        'appliances',
        'clothing',
        'jewelry',
        'documents',
        'tools',
        'other'
      )
    `);

    await queryRunner.query(`
      DELETE FROM household.inventory_rooms
      WHERE code IN (
        'living-room',
        'bedroom',
        'kitchen',
        'bathroom',
        'dining-room',
        'office',
        'garage',
        'basement',
        'attic',
        'other'
      )
    `);
  }
}
