
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { HouseholdEntity } from '../../households/entities/household.entity';

/**
 * Defines the available roles a user can have within a household.
 */
export type HouseholdRole = 'owner' | 'member';

/**
 * Represents a user's membership in a household.
 *
 * Maps to the `household_members` table in the `household` schema.
 * Uses a composite primary key consisting of the household ID and user ID
 * to ensure that each user has only one membership per household.
 */
@Entity({ schema: 'household', name: 'household_members', synchronize: false })
export class HouseholdMemberEntity {
  /**
   * The unique identifier of the household.
   *
   * Part of the composite primary key.
   */
  @PrimaryColumn({ name: 'household_id', type: 'uuid' })
  householdId!: string;

  /**
   * The unique identifier of the user.
   *
   * Part of the composite primary key.
   */
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 255 })
  userId!: string;

  /**
   * The user's role within the household.
   *
   * Defaults to `member` when no role is explicitly assigned.
   */
  @Column({ type: 'varchar', length: 20, default: 'member' })
  role!: HouseholdRole;

  /**
   * The date and time when the user joined the household.
   *
   * Defaults to the current database timestamp.
   */
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  /**
   * The household associated with this membership.
   *
   * Each membership belongs to exactly one household.
   */
  @ManyToOne(() => HouseholdEntity, { nullable: false })
  @JoinColumn({ name: 'household_id', referencedColumnName: 'id' })
  household!: HouseholdEntity;
}
