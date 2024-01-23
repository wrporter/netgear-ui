import { Button, Spinner, tv } from '@nextui-org/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { defer } from '@remix-run/node';
import { Await, useFetcher, useLoaderData } from '@remix-run/react';
import React, { Suspense } from 'react';
import { twMerge } from 'tailwind-merge';

import { requireUser } from '~/auth.server';
import { disablePoePorts, enablePoePorts, poeStatus } from '~/server/cmd.server';
import { poe } from '~/server/cron.server';
import { readDatabase, updateDatabase } from '~/server/database.server';

const portVariants = tv({
    variants: {
        power: {
            true: 'bg-green-300',
        },
    },
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await requireUser(request);

    const status = poeStatus();
    const database = await readDatabase();

    return defer({
        status,
        config: database.poe,
        poe: {
            nextOff: poe.offCron.nextDate().toFormat('DD t'),
            nextOn: poe.onCron.nextDate().toFormat('DD t'),
        },
    });
};

export const action = async ({ request }: ActionFunctionArgs) => {
    await requireUser(request);

    const formData = await request.formData();
    const power = formData.get('power');
    if (typeof power === 'string') {
        if (power === 'on') {
            await enablePoePorts();
        } else {
            await disablePoePorts();
        }
    }

    const scheduleEnabled = formData.get('scheduleEnabled');
    if (typeof scheduleEnabled === 'string') {
        await updateDatabase({ poe: { scheduleEnabled: scheduleEnabled === 'on' } });
    }

    return null;
};

export default function Page() {
    const data = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === 'submitting';
    const isLoading = fetcher.state === 'loading';

    return (
        <div className="p-4 flex flex-col space-y-4">
            {isSubmitting ? (
                <Spinner label="Updating PoE power..." />
            ) : (
                <div className="flex space-x-2">
                    <fetcher.Form method="POST">
                        <input className="hidden" name="power" defaultValue="on" />
                        <Button type="submit" color="primary">
                            Turn ports ON
                        </Button>
                    </fetcher.Form>
                    <fetcher.Form method="POST">
                        <input className="hidden" name="power" defaultValue="off" />
                        <Button type="submit" color="default">
                            Turn ports OFF
                        </Button>
                    </fetcher.Form>
                </div>
            )}

            <fetcher.Form method="POST">
                <input
                    className="hidden"
                    name="scheduleEnabled"
                    defaultValue={data.config.scheduleEnabled ? 'off' : 'on'}
                />
                <Button type="submit" color={data.config.scheduleEnabled ? 'danger' : 'primary'}>
                    {data.config.scheduleEnabled ? 'Disable Schedule' : 'Enable Schedule'}
                </Button>
            </fetcher.Form>

            <div>Next off: {data.poe.nextOff}</div>
            <div>Next on: {data.poe.nextOn}</div>

            <Suspense fallback={<Spinner label="Loading PoE status..." />}>
                <Await resolve={data?.status}>
                    {(status) =>
                        isLoading ? (
                            <Spinner label="Loading PoE status..." />
                        ) : (
                            <table className="shadow-lg bg-white border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-blue-100 border text-left px-8 py-4">
                                            Port
                                        </th>
                                        <th className="bg-blue-100 border text-left px-8 py-4">
                                            Power
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {status.map((port) => (
                                        <tr
                                            key={port.portId}
                                            className="hover:bg-gray-50 focus:bg-gray-300"
                                        >
                                            <td className="border px-8 py-4">{port.portId}</td>
                                            <td
                                                className={twMerge(
                                                    'border px-8 py-4',
                                                    portVariants({ power: port.power }),
                                                )}
                                            >
                                                {port.power ? 'On' : 'Off'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    }
                </Await>
            </Suspense>
        </div>
    );
}
