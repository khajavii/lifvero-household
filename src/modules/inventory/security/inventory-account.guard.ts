import {
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { messages } from '../../../messages';
import type { JwtAuthenticatedRequest } from '../../auth/interfaces/jwt-principal.interface';

/** Allows inventory access only to verified account sessions. */
@Injectable()
export class InventoryAccountGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context
            .switchToHttp()
            .getRequest<JwtAuthenticatedRequest>();

        if (!user) {
            throw new UnauthorizedException(messages.auth.INVALID_ACCESS_TOKEN);
        }

        if (user.sessionType !== 'account') {
            throw new ForbiddenException(messages.auth.ACCOUNT_REQUIRED);
        }

        return true;
    }
}
