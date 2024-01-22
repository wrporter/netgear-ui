import { Outlet } from '@remix-run/react';
import React from 'react';

export default function Layout() {
    return (
        <div className="text-foreground bg-background flex flex-col flex-grow h-full">
            <Outlet />
        </div>
    );
}
