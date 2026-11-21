import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './strategy/jwt/jwt-auth.guard';
import { JwtStrategy } from './strategy/jwt/jwt.strategy';

@Module({
  imports: [ConfigModule, PassportModule],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
