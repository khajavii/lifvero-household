
import { Injectable } from '@nestjs/common';
import type { EntityManager, DataSource } from 'typeorm';

import { Household } from '../repositories/household.interface';
import { HouseholdEntity } from '../entities/household.entity';
import { HouseholdMemberEntity } from '../../household-members/entities/household-member.entity';

import { HouseholdsRepository } from './households.repository';

/**
 * PostgreSQL implementation of the households repository.
 *
 * Handles household retrieval, creation, and ownership management
 * using TypeORM and PostgreSQL transactions.
 *
 * Ensures household creation and owner membership assignment are
 * performed atomically and prevents duplicate default household
 * creation through transaction-level advisory locks.
 */
@Injectable()
export class PostgresHouseholdsRepository extends HouseholdsRepository {
    /**
     * Creates an instance of PostgresHouseholdsRepository.
     *
     * @param db - The TypeORM data source used to execute database operations.
     */
    constructor(private readonly db: DataSource) {
        super();
    }

    /**
     * Retrieves all households associated with a user.
     *
     * Joins household records with their membership records and returns
     * the user's associated households, including their membership roles.
     *
     * @param userId - The ID of the user whose households are being retrieved.
     * @returns A promise that resolves to the user's households.
     */
    async listForUser(userId: string): Promise<Household[]> {
        const memberships = await this.db
            .getRepository(HouseholdMemberEntity)
            .createQueryBuilder('member')
            .innerJoinAndSelect('member.household', 'household')
            .where('member.userId = :userId', { userId })
            .orderBy('household.createdAt', 'ASC')
            .getMany();

        return memberships.map((membership): Household => ({
            id: membership.household.id,
            name: membership.household.name,
            role: membership.role,
            createdAt: membership.household.createdAt,
            updatedAt: membership.household.updatedAt,
        }));
    }

    /**
     * Creates a household and assigns the specified user as its owner.
     *
     * Creates both the household record and its owner membership within
     * the same database transaction to ensure atomicity.
     *
     * If an entity manager is provided, the operation participates in the
     * existing transaction. Otherwise, a new database transaction is started.
     *
     * @param name - The name of the household to create.
     * @param userId - The ID of the user who will be assigned as the household owner.
     * @param manager - An optional entity manager used to participate in an existing transaction.
     * @returns A promise that resolves to the created household, including its owner role.
     */
    async createWithOwner(
        name: string,
        userId: string,
        manager?: EntityManager,
    ): Promise<Household> {
        const insert = async (tx: EntityManager): Promise<Household> => {
            const households = tx.getRepository(HouseholdEntity);

            const household = await households.save(
                households.create({ name }),
            );

            await tx.getRepository(HouseholdMemberEntity).insert({
                householdId: household.id,
                userId,
                role: 'owner',
            });

            return {
                id: household.id,
                name: household.name,
                role: 'owner',
                createdAt: household.createdAt,
                updatedAt: household.updatedAt,
            };
        };

        // Manual creation starts a new transaction; Inventory creation reuses the existing transaction.
        return manager
            ? insert(manager)
            : this.db.transaction(insert);
    }

    /**
     * Finds the earliest household owned by a user or creates a default one if none exists.
     *
     * Acquires a PostgreSQL transaction-level advisory lock using the user ID
     * to serialize concurrent household resolution requests for the same user.
     *
     * After acquiring the lock, searches for an existing owned household.
     * If multiple owned households exist, the earliest one is selected based
     * on its creation timestamp, with its ID used as a deterministic tie-breaker.
     *
     * If no owned household exists, creates a new household using the supplied
     * default name and assigns the user as its owner.
     *
     * All database operations participate in the transaction associated with
     * the provided entity manager. The advisory lock remains held until that
     * transaction is committed or rolled back.
     *
     * @param userId - The ID of the user whose owned household is being resolved.
     * @param defaultName - The name to use when creating a default household.
     * @param manager - The entity manager associated with the active database transaction.
     * @returns A promise that resolves to the ID of the existing or newly created household.
     */
    async findOrCreateOwnedId(
        userId: string,
        defaultName: string,
        manager: EntityManager,
    ): Promise<string> {
        // Serialize concurrent requests for the same user to prevent duplicate default household creation.
        await manager.query(
            'SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))',
            [userId],
        );

        const [owned]: { id: string }[] = await manager.query(
            `SELECT h.id
             FROM household.household_members AS m
                      JOIN household.households AS h ON h.id = m.household_id
             WHERE m.user_id = $1 AND m.role = 'owner'
             ORDER BY h.created_at ASC, h.id ASC
                 LIMIT 1
             FOR SHARE OF h, m`,
            [userId],
        );

        if (owned) {
            return owned.id;
        }

        const household = await this.createWithOwner(
            defaultName,
            userId,
            manager,
        );

        return household.id;
    }
}
