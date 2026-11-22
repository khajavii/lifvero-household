
import { InventoryMessages as EnInventoryMessages } from './en/inventory';
import { AuthMessages as EnAuthMessages } from './en/auth';
import { DatabaseMessages as EnDatabaseMessages } from './en/database';

/**
 * Defines all supported application languages.
 */
export const Messages = {
    en: {
        inventory: EnInventoryMessages,
        auth: EnAuthMessages,
        database: EnDatabaseMessages
    },
} as const;

/**
 * Represents the supported application language.
 */
export type Language = keyof typeof Messages;

/**
 * Represents the default application language.
 */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Provides access to messages using the default language.
 */
export const messages = Messages[DEFAULT_LANGUAGE];
