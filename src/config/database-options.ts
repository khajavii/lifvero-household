import { readFileSync } from 'node:fs';
import type { DataSourceOptions } from 'typeorm';

export function createDatabaseOptions(
    env: NodeJS.ProcessEnv,
): DataSourceOptions {
  const required = (key: string): string => {
    const value = env[key];
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  };

  const port = Number(env.DB_PORT ?? '5432');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be a valid port number.');
  }

  const ssl = env.DB_SSL ?? 'true';
  if (ssl !== 'true' && ssl !== 'false') {
    throw new Error('DB_SSL must be true or false.');
  }
  if (env.NODE_ENV === 'production' && ssl === 'false') {
    throw new Error('Database TLS must be enabled in production.');
  }

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

    ssl: ssl === 'true'
        ? {
          rejectUnauthorized: true,
          ...(caPath ? { ca: readFileSync(caPath, 'utf8') } : {}),
        }
        : false,

    extra: {
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    },
  };
}
