
import {
    BadGatewayException,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { authConfig } from '../config/auth.config';
import { messages } from '../../../messages';
/**
 * Represents the authentication service response.
 */
interface AuthApiResponse {
    success: boolean;
    message: string;
    data: {
        isNewUser: boolean;
        access_token: string;
    };
    status: number;
}

/**
 * Represents a successfully authenticated user.
 */
export interface AuthResult {
    userId: string;
    accessToken: string;
    isNewUser: boolean;
}

/**
 * Handles communication with the central authentication service.
 *
 * Responsible for requesting user authentication and validating
 * the JWT returned by the authentication service.
 */
@Injectable()
export class AuthClient {
    constructor(
        private readonly http: HttpService,
        private readonly jwt: JwtService,
        private readonly configService: ConfigService,

        @Inject(authConfig.KEY)
        private readonly config: ConfigType<typeof authConfig>,
    ) {}

    /**
     * Authenticates or registers a user using their email address.
     *
     * @param email - The user's email address.
     * @returns The verified authentication result.
     * @throws BadGatewayException If the authentication service is unavailable
     * or returns an invalid response.
     * @throws UnauthorizedException If the returned JWT is invalid.
     */
    async loginOrRegister(email: string): Promise<AuthResult> {
        const url = new URL(
            this.config.loginPath,
            this.config.baseUrl,
        ).toString();

        let response: AuthApiResponse;

        try {
            const result = await firstValueFrom(
                this.http.post<AuthApiResponse>(
                    url,
                    { email },
                    {
                        timeout: this.config.timeout,
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                ),
            );

            response = result.data;
        } catch {
            throw new BadGatewayException(
                messages.auth.AUTH_SERVICE_REQUEST_FAILED,
            );
        }

        if (
            !response?.success ||
            !response.data?.access_token ||
            typeof response.data.isNewUser !== 'boolean'
        ) {
            throw new BadGatewayException(
                messages.auth.INVALID_AUTH_SERVICE_RESPONSE,
            );
        }

        const accessToken = response.data.access_token;

        let payload: { sub?: unknown };

        try {
            payload = await this.jwt.verifyAsync<{ sub?: unknown }>(
                accessToken,
                {
                    secret: this.configService.getOrThrow<string>(
                        'JWT_SECRET',
                    ),
                    algorithms: ['HS256'],
                    issuer: this.config.issuer,
                    audience: this.config.audience,
                },
            );
        } catch {
            throw new UnauthorizedException(
                messages.auth.INVALID_RETURNED_ACCESS_TOKEN,
            );
        }

        if (
            typeof payload.sub !== 'string' ||
            !payload.sub.trim() ||
            payload.sub.length > 255
        ) {
            throw new UnauthorizedException(
                messages.auth.INVALID_AUTHENTICATED_USER,
            );
        }

        return {
            userId: payload.sub,
            accessToken,
            isNewUser: response.data.isNewUser,
        };
    }
}