import { createCookieSessionStorage } from '@remix-run/node';
import { createThemeSessionResolver } from 'remix-themes';

import { env } from '~/server/env.server';

export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: '__session',
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
        secrets: [env.SESSION_SECRET],
        secure: env.NODE_ENV === 'production',
    },
});

const themeSessionStorage = createCookieSessionStorage({
    cookie: {
        name: '__remix-themes',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets: [env.SESSION_SECRET],
        secure: env.NODE_ENV === 'production',
    },
});

export const themeSessionResolver = createThemeSessionResolver(themeSessionStorage);
