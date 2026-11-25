/**
 * Database configuration messages.
 */
export const DatabaseMessages = {
    MISSING_ENVIRONMENT_VARIABLE:
        'Missing environment variable: {key}',

    INVALID_DB_PORT:
        'DB_PORT must be a valid port number.',

    INVALID_DB_SSL:
        'DB_SSL must be true or false.',

    DB_SSL_REQUIRED_IN_PRODUCTION:
        'Database TLS must be enabled in production.',
} as const;