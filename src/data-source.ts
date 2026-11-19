import 'reflect-metadata';
import 'dotenv/config';

import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from './config/database-options';

export default new DataSource({
    ...createDatabaseOptions(process.env),

    entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'household_migrations',
    migrationsTransactionMode: 'all',
});
