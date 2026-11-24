
/**
 * Represents the user's role within a household.
 *
 * Defines the available membership roles that determine
 * the user's level of access within a household.
 */
export type HouseholdRole = 'owner' | 'member';

/**
 * Represents a household along with the user's membership information.
 *
 * Contains the household's identifying information, ownership role,
 * and timestamps indicating when the household was created and updated.
 */
export interface Household {
    /**
     * The unique identifier of the household.
     */
    id: string;

    /**
     * The display name of the household.
     */
    name: string;

    /**
     * The role assigned to the user within the household.
     *
     * Determines whether the user is the household owner or a member.
     */
    role: HouseholdRole;

    /**
     * The date and time when the household was created.
     */
    createdAt: Date;

    /**
     * The date and time when the household was last updated.
     */
    updatedAt: Date;
}
