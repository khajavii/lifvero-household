import { registerAs } from '@nestjs/config';
import { messages } from '../../../messages';

/**
 * Household module configuration.
 *
 * Loads and validates the default household name from environment variables.
 *
 * @throws {Error} If HOUSEHOLD_DEFAULT_NAME is missing, empty, or exceeds 100 characters.
 */
export const householdsConfig = registerAs('households', () => {
    const defaultName = process.env.HOUSEHOLD_DEFAULT_NAME?.trim();

    if (!defaultName || Array.from(defaultName).length > 100) {
        throw new Error(
            messages.households.HOUSEHOLD_DEFAULT_NAME_INVALID,
        );
    }

    return { defaultName };
});