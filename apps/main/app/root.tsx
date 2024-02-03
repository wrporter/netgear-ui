import { NextUIProvider } from '@nextui-org/react';
import { cssBundleHref } from '@remix-run/css-bundle';
import type { LinksFunction, LoaderFunction, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
    Links,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useNavigate,
} from '@remix-run/react';
import { PreventFlashOnWrongTheme, ThemeProvider } from 'remix-themes';

import { getUser } from '~/auth.server';
import { themeSessionResolver } from '~/session.server';
import stylesheet from '~/tailwind.css';

export const links: LinksFunction = () => [
    { rel: 'stylesheet', href: stylesheet },
    ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => [
    { charset: 'utf-8' },
    { title: 'Netgear Control' },
    { viewport: 'width=device-width,initial-scale=1' },
];

export const loader: LoaderFunction = async ({ request }) => {
    const { getTheme } = await themeSessionResolver(request);
    return json({
        user: await getUser(request),
        theme: getTheme(),
    });
};

export default function App() {
    const navigate = useNavigate();
    const data = useLoaderData<typeof loader>();

    return (
        <ThemeProvider specifiedTheme={data.theme} themeAction="/set-theme">
            <html lang="en" className="h-full">
                <head>
                    <meta charSet="utf-8" />
                    <meta name="viewport" content="width=device-width,initial-scale=1" />
                    <Meta />
                    <PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
                    <Links />
                </head>
                <body className="h-full">
                    <NextUIProvider className="h-full" navigate={navigate}>
                        <Outlet />
                        <ScrollRestoration />
                        <Scripts />
                        <LiveReload />
                    </NextUIProvider>
                </body>
            </html>
        </ThemeProvider>
    );
}
