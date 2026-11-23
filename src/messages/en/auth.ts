
export const AuthMessages = {
    // Swagger tags
    AUTH_TAG: 'Authentication',

    // Swagger summaries
    LOGIN_OR_REGISTER: 'Login or register using email',

    // Swagger descriptions
    LOGIN_OR_REGISTER_DESCRIPTION:
        'Delegates email authentication to the central Lifvero Auth Service. ' +
        'New users are registered automatically. Existing users follow the authentication flow implemented by the central Auth Service.',

    // Success messages
    AUTHENTICATION_SUCCESSFUL: 'Authentication successful',

    // Error messages
    INVALID_EMAIL: 'Please provide a valid email address',

    AUTH_SERVICE_REQUEST_FAILED:
        'Authentication service request failed',

    INVALID_AUTH_SERVICE_RESPONSE:
        'Invalid authentication service response',

    INVALID_ACCESS_TOKEN:
        'Invalid access token',

    INVALID_RETURNED_ACCESS_TOKEN:
        'Authentication service returned an invalid access token',

    INVALID_AUTHENTICATED_USER:
        'Invalid authenticated user',

    MISSING_ACCESS_TOKEN:
        'Missing or invalid access token',

    UNAUTHORIZED:
        'Authentication is required',

    INVALID_AUTH_SERVICE_BASE_URL:
        'Invalid authentication service base URL',

    AUTH_SERVICE_LOGIN_PATH_MUST_START_WITH_SLASH:
        'Authentication service login path must start with /',

    INVALID_AUTH_SERVICE_TIMEOUT:
        'Invalid authentication service timeout',
    ACCOUNT_REQUIRED:
        'Account Request'
} as const;
