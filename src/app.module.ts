import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { createDatabaseOptions } from './config/database-options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (
          configService: ConfigService,
      ): TypeOrmModuleOptions => ({
        ...createDatabaseOptions({
          NODE_ENV:
              configService.get<string>('NODE_ENV'),

          DB_HOST:
              configService.getOrThrow<string>('DB_HOST'),

          DB_PORT:
              configService.get<string>('DB_PORT') ?? '5432',

          DB_USERNAME:
              configService.getOrThrow<string>('DB_USERNAME'),

          DB_PASSWORD:
              configService.getOrThrow<string>('DB_PASSWORD'),

          DB_DATABASE:
              configService.getOrThrow<string>('DB_DATABASE'),

          DB_SSL:
              configService.get<string>('DB_SSL') ?? 'true',

          DB_SSL_CA_PATH:
              configService.get<string>('DB_SSL_CA_PATH'),
        }),

        autoLoadEntities: true,

        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),

    AuthModule,
  ],
})
export class AppModule {}
