import { Module } from '@nestjs/common';
import { HouseholdMembersService } from './household-members.service';

@Module({
  providers: [HouseholdMembersService]
})
export class HouseholdMembersModule {}
