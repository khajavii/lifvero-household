/** A principal returned by the JWT strategy after token verification. */
export interface JwtPrincipal {
    /** Stable account or guest identifier from the verified JWT subject. */
    userId: string;
    sessionType: 'account' | 'guest';
}

/** HTTP request shape used by authentication guards and decorators. */
export interface JwtAuthenticatedRequest {
    user?: JwtPrincipal;
}
