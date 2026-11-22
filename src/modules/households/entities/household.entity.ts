import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Represents a household in the database.
 *
 * Maps to the `households` table within the `household` schema.
 * Database synchronization is disabled for this entity.
 */
@Entity({ schema: 'household', name: 'households', synchronize: false })
export class HouseholdEntity {
  /**
   * Unique identifier of the household.
   *
   * Automatically generated as a UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Name of the household.
   *
   * Maximum length is 100 characters.
   */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /**
   * Date and time when the household was created.
   *
   * Defaults to the current database timestamp.
   */
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  /**
   * Date and time when the household was last updated.
   *
   * Defaults to the current database timestamp.
   */
  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;
}