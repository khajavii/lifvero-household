
import { registerAs } from '@nestjs/config';
import {messages} from "../../../messages";

/**
 * Retrieves a required environment variable.
 *
 * @param name - The environment variable name.
 * @returns The configured environment variable value.
 * @throws Error If the environment variable is missing.
 */
function required(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Missing configuration: ${name}`);
    }

    return value;
}

/**
 * Loads and validates the central authentication service configuration.
 */
export const authConfig = registerAs('auth', () => {
    const baseUrl = required('AUTH_SERVICE_BASE_URL');
    const loginPath = required('AUTH_SERVICE_LOGIN_PATH');
    const issuer = required('JWT_ISSUER');
    const audience = required('JWT_AUDIENCE');
    const timeout = Number(required('AUTH_SERVICE_TIMEOUT_MS'));

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(baseUrl);
    } catch {
        throw new Error(messages.auth.INVALID_AUTH_SERVICE_BASE_URL);
    }

    if (
        !['https:', 'http:'].includes(parsedUrl.protocol) ||
        parsedUrl.username ||
        parsedUrl.password
    ) {
        throw new Error(messages.auth.INVALID_AUTH_SERVICE_BASE_URL);
    }

    if (!loginPath.startsWith('/')) {
        throw new Error(
            messages.auth.AUTH_SERVICE_LOGIN_PATH_MUST_START_WITH_SLASH,
        );
    }

    if (!Number.isSafeInteger(timeout) || timeout < 1) {
        throw new Error(
            messages.auth.INVALID_AUTH_SERVICE_TIMEOUT,
        );
    }

    return {
        baseUrl: parsedUrl.origin,
        loginPath,
        issuer,
        audience,
        timeout,
    };
});
