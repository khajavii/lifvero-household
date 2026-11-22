import { Injectable } from '@nestjs/common';
import { AuthClient, AuthResult } from './clients/auth.client';
import { GuestAuthDto } from './dto/guest-auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly authClient: AuthClient,
    ) {}

    /**
     * Authenticates or registers a user using their email address.
     *
     * @param input - The authentication data.
     * @returns The authentication result.
     */
    async loginOrRegister(
        input: GuestAuthDto,
    ): Promise<AuthResult> {
        return this.authClient.loginOrRegister(input.email);
    }
}