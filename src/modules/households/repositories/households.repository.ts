import type { EntityManager } from 'typeorm';
import {HouseholdEntity} from "../entities/household.entity";

// Household interface stays unchanged.

/**
 * Defines the contract for household data operations.
 *
 * Provides methods for retrieving, creating, and resolving
 * households owned by users.
 */
export abstract class HouseholdsRepository {
    /**
     * Retrieves all households associated with a user.
     *
     * @param userId - The ID of the user.
     * @returns A promise that resolves to the user's households.
     */
    abstract listForUser(userId: string): Promise<HouseholdEntity[]>;

    /**
     * Creates a household and assigns its creator as the owner.
     *
     * When an entity manager is provided, the operation uses the
     * existing transaction. Otherwise, a new transaction is created.
     *
     * @param name - The name of the household.
     * @param userId - The ID of the user who will own the household.
     * @param manager - Optional entity manager for an existing transaction.
     * @returns A promise that resolves to the created household with the owner role.
     */
    abstract createWithOwner(
        name: string,
        userId: string,
        manager?: EntityManager,
    ): Promise<HouseholdEntity>;

    /**
     * Finds the user's earliest owned household or creates one if none exists.
     *
     * Uses a PostgreSQL transaction-level advisory lock to prevent
     * concurrent requests from creating duplicate default households.
     *
     * @param userId - The ID of the user.
     * @param defaultName - The name assigned to a newly created household.
     * @param manager - The entity manager associated with the current transaction.
     * @returns A promise that resolves to the ID of the owned household.
     */
    abstract findOrCreateOwnedId(
        userId: string,
        defaultName: string,
        manager: EntityManager,
    ): Promise<string>;
}