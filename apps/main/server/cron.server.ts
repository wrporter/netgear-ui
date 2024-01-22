import { CronJob, CronTime } from 'cron';

import { disablePoePorts, enablePoePorts } from './cmd.server';
import { readDatabase } from './database.server';
import { singleton } from './singleton.server';

export const poe = singleton('poe', () => ({
    offCron: new CronJob('0 0 0 1 1 0', async () => {
        const database = await readDatabase();
        if (database.poe.scheduleEnabled) {
            await disablePoePorts();
        }
    }),
    onCron: new CronJob('0 0 0 1 1 0', async () => {
        const database = await readDatabase();
        if (database.poe.scheduleEnabled) {
            await enablePoePorts();
        }
    }),
}));

export async function initCronJobs() {
    const database = await readDatabase();
    poe.offCron.setTime(new CronTime(database.poe.offCron, 'America/Denver'));
    poe.onCron.setTime(new CronTime(database.poe.onCron, 'America/Denver'));

    console.log(poe.offCron.nextDate());
    console.log(poe.onCron.nextDate());
}
