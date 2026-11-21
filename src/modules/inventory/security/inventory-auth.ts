
import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const strategyName = 'personal-inventory-jwt';

export interface AuthPrincipal {
  userId: string;
  sessionType: 'account' | 'guest';
}

interface AuthRequest {
  user?: AuthPrincipal;
}

@Injectable()
export class InventoryJwtStrategy extends PassportStrategy(
    Strategy,
    strategyName,
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  validate(payload: {
    sub?: unknown;
    exp?: unknown;
    session_type?: unknown;
  }): AuthPrincipal {
    const {
      sub,
      exp,
      session_type: sessionType,
    } = payload;

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

    return {
      userId: sub,
      sessionType,
    };
  }
}

@Injectable()
export class InventoryJwtGuard extends AuthGuard(strategyName) {}

@Injectable()
export class InventoryAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp()
        .getRequest<AuthRequest>().user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.sessionType !== 'account') {
      throw new ForbiddenException(
          'A verified account is required',
      );
    }

    return true;
  }
}

export const CurrentAccountId = createParamDecorator(
    (_data: unknown, context: ExecutionContext): string => {
      const user = context.switchToHttp()
          .getRequest<AuthRequest>().user;

      if (!user) {
        throw new UnauthorizedException();
      }

      return user.userId;
    },
);
