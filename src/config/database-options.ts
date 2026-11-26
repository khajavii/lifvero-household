import type { DataSourceOptions } from 'typeorm';
import { messages } from '../messages';

/**
 * Creates PostgreSQL database connection options from environment variables.
 *
 * Configures SSL with `rejectUnauthorized: false` for managed PostgreSQL providers
 * like Supabase (both locally and on serverless environments like Vercel)
 * without requiring any external CA certificate files.
 *
 * @param env - Environment variables used to configure the database connection.
 * @returns TypeORM PostgreSQL connection options.
 * @throws Error If a required environment variable is missing or invalid.
 */
export function createDatabaseOptions(
    env: NodeJS.ProcessEnv,
): DataSourceOptions {
    /**
     * Retrieves a required environment variable.
     */
    const required = (key: string): string => {
        const value = env[key];

        if (!value?.trim()) {
            throw new Error(
                messages.database.MISSING_ENVIRONMENT_VARIABLE.replace(
                    '{key}',
                    key,
                ),
            );
        }

        return value;
    };

    /**
     * Validates the database port.
     */
    const port = Number(env.DB_PORT ?? '5432');

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(messages.database.INVALID_DB_PORT);
    }

    /**
     * Validates database SSL configuration.
     */
    const ssl = env.DB_SSL ?? 'true';

    if (ssl !== 'true' && ssl !== 'false') {
        throw new Error(messages.database.INVALID_DB_SSL);
    }

    if (env.NODE_ENV === 'production' && ssl === 'false') {
        throw new Error(
            messages.database.DB_SSL_REQUIRED_IN_PRODUCTION,
        );
    }

    return {
        type: 'postgres',

        host: required('DB_HOST'),
        port,
        username: required('DB_USERNAME'),
        password: required('DB_PASSWORD'),
        database: required('DB_DATABASE'),

        schema: 'public',

        synchronize: false,
        migrationsRun: false,
        logging: false,

        /**
         * SSL configuration:
         * Uses rejectUnauthorized: false to allow connection to Supabase pooler/direct
         * without needing a separate certificate file or hitting SELF_SIGNED_CERT_IN_CHAIN.
         */
        ssl:
            ssl === 'true'
                ? {
                      rejectUnauthorized: false,
                  }
                : false,

        extra: {
            max: 10,
            connectionTimeoutMillis: 10_000,
            idleTimeoutMillis: 30_000,
        },
    };
}
