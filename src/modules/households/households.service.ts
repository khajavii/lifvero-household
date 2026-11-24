import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { EntityManager } from 'typeorm';
import { householdsConfig } from './config/households.config';
import { HouseholdsRepository } from './repositories/households.repository';

/**
 * Handles household-related business operations.
 *
 * Delegates data operations to the households repository and
 * provides access to the household configuration.
 */
@Injectable()
export class HouseholdsService {
    /**
     * Creates an instance of HouseholdsService.
     *
     * @param repository - The repository responsible for household data operations.
     * @param config - The household module configuration.
     */
    constructor(
        @Inject(HouseholdsRepository)
        private readonly repository: HouseholdsRepository,

        @Inject(householdsConfig.KEY)
        private readonly config: ConfigType<typeof householdsConfig>,
    ) {}

    /**
     * Retrieves all households associated with a user.
     *
     * @param userId - The ID of the user.
     * @returns A promise that resolves to the user's households.
     */
    listForUser(userId: string) {
        return this.repository.listForUser(userId);
    }

    /**
     * Creates a new household for a user and assigns them as its owner.
     *
     * @param userId - The ID of the user who will own the household.
     * @param name - The name of the household.
     * @returns A promise that resolves to the created household.
     */
    createForUser(userId: string, name: string) {
        return this.repository.createWithOwner(name, userId);
    }

    /**
     * Resolves the ID of a user's owned household.
     *
     * Returns the existing owned household ID or creates a default
     * household using the configured default name when none exists.
     *
     * @param userId - The ID of the user.
     * @param manager - The entity manager associated with the current transaction.
     * @returns A promise that resolves to the owned household ID.
     */
    resolveOwnedHouseholdId(
        userId: string,
        manager: EntityManager,
    ): Promise<string> {
        return this.repository.findOrCreateOwnedId(
            userId,
            this.config.defaultName,
            manager,
        );
    }
}