
import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {messages} from "../../../../messages";

/**
 * Represents the authenticated user extracted from a JWT.
 */
export interface AuthPrincipal {
    userId: string;
    sessionType: 'account' | 'guest';
}

/**
 * Validates access tokens issued by the central Auth Service.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
            algorithms: ['HS256'],
            issuer: config.getOrThrow<string>('JWT_ISSUER'),
            audience: config.getOrThrow<string>('JWT_AUDIENCE'),
            ignoreExpiration: false,
        });
    }

    /**
     * Validates the JWT payload and extracts the authenticated user principal.
     *
     * @param payload - The decoded JWT payload.
     * @returns The authenticated user principal.
     * @throws UnauthorizedException If the user ID is invalid.
     */
    validate(payload: {
        sub?: unknown;
        session_type?: unknown;
        sessionType?: unknown;
    }): AuthPrincipal {
        const { sub } = payload;

        if (
            typeof sub !== 'string' ||
            !sub.trim() ||
            sub.length > 255
        ) {
            throw new UnauthorizedException(
                messages.auth.INVALID_ACCESS_TOKEN,
            );
        }

        const sessionType =
            payload.sessionType === 'guest' || payload.session_type === 'guest'
                ? 'guest'
                : 'account';

        return {
            userId: sub,
            sessionType,
        };
    }
}
