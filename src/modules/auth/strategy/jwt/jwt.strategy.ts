import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AuthPrincipal {
    userId: string;
    sessionType: 'account' | 'guest';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config
                .getOrThrow<string>('AUTH_JWT_PUBLIC_KEY')
                .replace(/\\n/g, '\n'),
            algorithms: ['RS256'],
            issuer: config.getOrThrow<string>('AUTH_JWT_ISSUER'),
            audience: config.getOrThrow<string>('AUTH_JWT_AUDIENCE'),
            ignoreExpiration: false,
        });
    }

    validate(payload: {
        sub?: unknown;
        exp?: unknown;
        session_type?: unknown;
    }): AuthPrincipal {
        const { sub, exp, session_type: sessionType } = payload;

        if (
            typeof sub !== 'string' ||
            !sub.trim() ||
            sub.length > 255 ||
            typeof exp !== 'number' ||
            !Number.isInteger(exp) ||
            (sessionType !== 'account' && sessionType !== 'guest') ||
            sub.startsWith('guest:') !== (sessionType === 'guest')
        ) {
            throw new UnauthorizedException('Invalid access token');
        }

        return { userId: sub, sessionType };
    }
}
