import { CronJob, CronTime } from 'cron';

import { disablePoePorts, enablePoePorts } from './cmd.server';
import { readDatabase } from './database.server';
import { log } from './logger.server';
import { singleton } from './singleton.server';

export const poe = singleton('poe', () => ({
    offCron: new CronJob('0 0 0 1 1 0', async function off() {
        const database = await readDatabase();
        log.info({ message: 'Starting off cron.', scheduleEnabled: database.poe.scheduleEnabled });
        if (database.poe.scheduleEnabled) {
            log.info('Executing off cron.');
            await disablePoePorts();
        } else {
            log.info('Did not execute off cron.');
        }
    }),
    onCron: new CronJob('0 0 0 1 1 0', async function on() {
        const database = await readDatabase();
        log.info({ message: 'Starting on cron.', scheduleEnabled: database.poe.scheduleEnabled });
        if (database.poe.scheduleEnabled) {
            log.info('Executing on cron.');
            await enablePoePorts();
        } else {
            log.info('Did not execute on cron.');
        }
    }),
}));

export async function initCronJobs() {
    const database = await readDatabase();
    poe.offCron.setTime(new CronTime(database.poe.offCron, 'America/Denver'));
    poe.onCron.setTime(new CronTime(database.poe.onCron, 'America/Denver'));

    poe.offCron.start();
    poe.onCron.start();

    log.info({
        message: 'Off cron initialized.',
        schedule: poe.offCron.cronTime.source,
        nextDate: poe.offCron.nextDate().toString(),
    });
    log.info({
        message: 'On cron initialized.',
        schedule: poe.onCron.cronTime.source,
        nextDate: poe.onCron.nextDate().toString(),
    });
}
