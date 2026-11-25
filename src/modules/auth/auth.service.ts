import { Injectable } from '@nestjs/common';
import { AuthClient, AuthResult } from './clients/auth.client';
import { GuestAuthDto } from './dto/guest-auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly authClient: AuthClient,
    ) {}

}