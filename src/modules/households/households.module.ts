
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { householdsConfig } from './config/households.config';
import { HouseholdEntity } from './entities/household.entity';
import { HouseholdMemberEntity } from '../household-members/entities/household-member.entity';

import { HouseholdsRepository } from './repositories/households.repository';
import { PostgresHouseholdsRepository } from './repositories/postgres-households.repository';

@Module({
  imports: [
    ConfigModule.forFeature(householdsConfig),
    TypeOrmModule.forFeature([
      HouseholdEntity,
      HouseholdMemberEntity,
    ]),
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
    TypeOrmModule,
  ],
})
export class HouseholdsModule {}

