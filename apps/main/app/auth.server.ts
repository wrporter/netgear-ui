import { Authenticator } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import invariant from 'tiny-invariant';

import { sessionStorage } from './session.server';

import { isValidPassword } from '~/server/database.server';

export const AUTH_ERROR_KEY = 'auth-error-key';

export const authenticator = new Authenticator(sessionStorage, {
    sessionErrorKey: AUTH_ERROR_KEY,
    throwOnError: true,
});

authenticator.use(
    new FormStrategy(async ({ form }) => {
        const password = form.get('password') as string;

        const isValid = await isValidPassword(password);
        invariant(isValid, 'Invalid password');

        return { loggedIn: true };
    }),
    'basic',
);

export async function getUser(request: Request) {
    return authenticator.isAuthenticated(request);
}

export async function requireUser(request: Request) {
    const redirectTo = new URL(request.url).pathname;
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    return authenticator.isAuthenticated(request, {
        failureRedirect: `/login?${searchParams}`,
    });
}
