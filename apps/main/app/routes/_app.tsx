import { Outlet } from '@remix-run/react';
import React from 'react';
import { useTheme } from 'remix-themes';

export default function Layout() {
    const [theme] = useTheme();
    return (
        <div className={`${theme} text-foreground bg-background flex flex-col flex-grow h-full`}>
            <Outlet />
        </div>
    );
}
