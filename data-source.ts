import 'reflect-metadata';
import 'dotenv/config';

import { join } from 'node:path';
import { DataSource } from 'typeorm';

import { createDatabaseOptions } from './config/database-options';

const connectionOptions = createDatabaseOptions(
  process.env,
  'migration',
);

export default new DataSource({
  ...connectionOptions,

  schema: 'public',

  migrationsTableName: 'household_migrations',

  entities: [
    join(__dirname, 'modules', '**', '*.entity.{ts,js}'),
  ],

  migrations: [
    join(__dirname, 'migrations', '*.{ts,js}'),
  ],

  migrationsTransactionMode: 'all',
});
