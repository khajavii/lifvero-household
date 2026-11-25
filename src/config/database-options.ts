import { readFileSync } from 'node:fs';
import type { DataSourceOptions } from 'typeorm';
import {messages} from "../messages";

/**
 * Creates PostgreSQL database connection options from environment variables.
 *
 * Validates the required database configuration, port number, and SSL settings.
 * When SSL is enabled, an optional CA certificate is loaded from the configured path.
 *
 * @param env - Environment variables used to configure the database connection.
 * @returns TypeORM PostgreSQL connection options.
 * @throws Error If a required environment variable is missing or a configuration value is invalid.
 * @throws Error If the configured SSL CA certificate cannot be read.
 */
export function createDatabaseOptions(
    env: NodeJS.ProcessEnv,
): DataSourceOptions {
  /**
   * Retrieves a required environment variable.
   *
   * @param key - Environment variable name.
   * @returns The configured environment variable value.
   * @throws Error If the environment variable is missing or empty.
   */
  const required = (key: string): string => {
    const value = env[key];

    if (!value) {
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
   * Validates and retrieves the database port.
   */
  const port = Number(env.DB_PORT ?? '5432');

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(messages.database.INVALID_DB_PORT);
  }

  /**
   * Validates the database SSL configuration.
   */
  const ssl = env.DB_SSL ?? 'true';

  if (ssl !== 'true' && ssl !== 'false') {
    throw new Error(messages.database.INVALID_DB_SSL);
  }

  if (env.NODE_ENV === 'production' && ssl === 'false') {
    throw new Error(messages.database.DB_SSL_REQUIRED_IN_PRODUCTION);
  }

  /**
   * Optional path to the database SSL CA certificate.
   */
  const caPath = env.DB_SSL_CA_PATH;

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

    ssl:
        ssl === 'true'
            ? {
              rejectUnauthorized: true,
              ...(caPath
                  ? { ca: readFileSync(caPath, 'utf8') }
                  : {}),
            }
            : false,

    extra: {
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    },
  };
}