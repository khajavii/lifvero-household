import { readFileSync } from 'node:fs';
import type { DataSourceOptions } from 'typeorm';

type DatabasePurpose = 'runtime' | 'migration';

export function createDatabaseOptions(
  env: NodeJS.ProcessEnv,
  purpose: DatabasePurpose = 'runtime',
): DataSourceOptions {
  const url =
    purpose === 'migration'
      ? env.DATABASE_MIGRATION_URL || env.DATABASE_URL
      : env.DATABASE_URL;

  if (!url) {
    throw new Error('Database connection URL is missing.');
  }

  const sslValue = env.DATABASE_SSL ?? 'true';

  if (!['true', 'false'].includes(sslValue)) {
    throw new Error('DATABASE_SSL must be true or false.');
  }

  if (env.NODE_ENV === 'production' && sslValue === 'false') {
    throw new Error('Database TLS must be enabled in production.');
  }

  const caPath = env.DATABASE_SSL_CA_PATH;

  return {
    type: 'postgres',

    url,

    schema: 'household',

    synchronize: false,

    migrationsRun: false,

    logging: false,

    ssl:
      sslValue === 'true'
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
