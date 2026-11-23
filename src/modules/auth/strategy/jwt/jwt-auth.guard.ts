import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { messages } from '../../../../messages';

/** Authenticates the request using the existing Passport JWT strategy. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /** Rejects failed authentication and returns the verified principal. */
    handleRequest<TUser>(error: unknown, user: TUser | false | null): TUser {
        if (error) {
            throw error;
        }

        if (!user) {
            throw new UnauthorizedException(messages.auth.INVALID_ACCESS_TOKEN);
        }

        return user;
    }
}
