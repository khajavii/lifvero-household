
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from './config/auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthClient } from './clients/auth.client';
import {JwtStrategy} from "./strategy/jwt/jwt.strategy";

/**
 * Provides centralized authentication functionality.
 *
 * Handles communication with the external Lifvero Auth Service,
 * validates returned JWTs, and exposes authentication endpoints
 * for other application clients.
 */
@Module({
  imports: [
    ConfigModule.forFeature(authConfig),

    HttpModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    AuthClient,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AuthClient,
  ],
})
export class AuthModule {}
