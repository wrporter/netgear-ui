import { useMatches } from '@remix-run/react';
import { useMemo } from 'react';

export interface User {
    loggedIn: boolean;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(id: string): Record<string, unknown> | undefined {
    const matchingRoutes = useMatches();
    const route = useMemo(
        () => matchingRoutes.find((route) => route.id === id),
        [matchingRoutes, id],
    );
    return route?.data as Record<string, unknown>;
}

function isUser(user: User): user is User {
    return user && typeof user === 'object' && user.loggedIn;
}

export function useOptionalUser(): User | undefined {
    const data = useMatchesData('root');
    if (!data || !isUser(data.user as User)) {
        return undefined;
    }
    return data.user as User;
}

export function useUser(): User {
    const maybeUser = useOptionalUser();
    if (!maybeUser) {
        throw new Error(
            'No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.',
        );
    }
    return maybeUser;
}
