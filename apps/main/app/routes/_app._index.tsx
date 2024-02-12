import {
    Button,
    Spinner,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    tv,
} from '@nextui-org/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { defer } from '@remix-run/node';
import { Await, useFetcher, useLoaderData } from '@remix-run/react';
import { withZod } from '@remix-validated-form/with-zod';
import React, { Suspense, useState } from 'react';
import { ValidatedForm, useFormContext, validationError } from 'remix-validated-form';
import { z } from 'zod';

import { requireUser } from '~/auth.server';
import { disablePoePorts, enablePoePorts, poeStatus } from '~/server/cmd.server';
import { poe, toDailyCronSyntax, updateSchedule } from '~/server/cron.server';
import { readDatabase, updateDatabase } from '~/server/database.server';
import { TimePicker } from '~/ui/time-picker';

const portVariants = tv({
    variants: {
        power: {
            true: 'bg-green-300 dark:bg-green-700',
        },
    },
});

const validator = withZod(
    z
        .object({
            scheduleEnabled: z.any().optional(),
            startOffTime: z
                .string()
                .regex(/\d{1,2}:\d{2} (am|pm)/i, {
                    message: 'Please enter a valid time in the format h:mm aa.',
                })
                .optional(),
            endOffTime: z
                .string()
                .regex(/\d{1,2}:\d{2} (am|pm)/i, {
                    message: 'Please enter a valid time in the format h:mm aa.',
                })
                .optional(),
        })
        .refine((schema) => {
            const enabled = schema.scheduleEnabled === '';
            return !enabled || (enabled && schema.startOffTime && schema.endOffTime);
        }, 'Please enter a time range when enabling the schedule.'),
);

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
    } else {
        const form = await validator.validate(formData);
        if (form.error) {
            return validationError(form.error);
        }
        const scheduleEnabled = form.data.scheduleEnabled === '';

        if (scheduleEnabled) {
            const offCron = toDailyCronSyntax(form.data.startOffTime ?? '');
            const onCron = toDailyCronSyntax(form.data.endOffTime ?? '');
            updateSchedule(offCron, onCron);
            await updateDatabase({
                poe: {
                    scheduleEnabled,
                    offCron,
                    onCron,
                },
            });
        } else {
            await updateDatabase({
                poe: {
                    scheduleEnabled,
                },
            });
        }
    }

    return null;
};

export default function Page() {
    const data = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === 'submitting';
    const isLoading = fetcher.state === 'loading';

    const form = useFormContext('scheduleForm');
    const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(data.config.scheduleEnabled);

    return (
        <div className="p-4 flex flex-col space-y-4 sm:max-w-96 min-w-80">
            <ValidatedForm
                id="scheduleForm"
                method="POST"
                className="flex flex-col space-y-2 border border-gray-500 p-2"
                validator={validator}
                noValidate
            >
                <Switch
                    name="scheduleEnabled"
                    isSelected={scheduleEnabled}
                    onValueChange={setScheduleEnabled}
                >
                    {scheduleEnabled ? 'Schedule ON' : 'Schedule OFF'}
                </Switch>

                {scheduleEnabled ? (
                    <>
                        <p>When to turn off Wi-Fi:</p>
                        <div className="flex">
                            <TimePicker
                                name="startOffTime"
                                label="Start"
                                defaultValue={new Date(Date.parse(data.poe.nextOff))}
                                errorMessage={form.fieldErrors.startOffTime}
                                className="w-1/2 mr-2"
                            />
                            <TimePicker
                                name="endOffTime"
                                label="End"
                                defaultValue={new Date(Date.parse(data.poe.nextOn))}
                                errorMessage={form.fieldErrors.endOffTime}
                                className="w-1/2"
                            />
                        </div>
                    </>
                ) : null}

                <Button type="submit" color="primary">
                    Save
                </Button>
            </ValidatedForm>

            {isSubmitting ? (
                <Spinner label="Updating PoE power..." />
            ) : (
                <div className="flex space-x-2">
                    <fetcher.Form method="POST" className="w-full">
                        <input className="hidden" name="power" defaultValue="on" />
                        <Button type="submit" color="primary" className="w-full">
                            Turn ports ON
                        </Button>
                    </fetcher.Form>

                    <fetcher.Form method="POST" className="w-full">
                        <input className="hidden" name="power" defaultValue="off" />
                        <Button type="submit" color="default" className="w-full">
                            Turn ports OFF
                        </Button>
                    </fetcher.Form>
                </div>
            )}

            <Suspense fallback={<Spinner label="Loading PoE status..." />}>
                <Await resolve={data?.status}>
                    {(status) =>
                        isLoading ? (
                            <Spinner label="Loading PoE status..." />
                        ) : (
                            <Table aria-label="PoE status">
                                <TableHeader>
                                    <TableColumn>Port</TableColumn>
                                    <TableColumn>Status</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {status.map((port) => (
                                        <TableRow key={port.portId}>
                                            <TableCell>{port.portId}</TableCell>
                                            <TableCell
                                                className={portVariants({ power: port.power })}
                                            >
                                                {port.power ? 'On' : 'Off'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                    }
                </Await>
            </Suspense>
        </div>
    );
}
