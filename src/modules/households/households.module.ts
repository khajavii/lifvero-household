
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { householdsConfig } from './config/households.config';

import { HouseholdsRepository } from './repositories/households.repository';
import { PostgresHouseholdsRepository } from './repositories/postgres-households.repository';

@Module({
  imports: [
    ConfigModule.forFeature(householdsConfig),
  ],

  controllers: [
    HouseholdsController,
  ],

  providers: [
    HouseholdsService,
    {
      provide: HouseholdsRepository,
      useClass: PostgresHouseholdsRepository,
    },
  ],

  exports: [
    HouseholdsService,
  ],
})
export class HouseholdsModule {}
