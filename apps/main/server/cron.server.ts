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

export function updateSchedule(offCron: string, onCron: string) {
    setTime(poe.offCron, offCron);
    setTime(poe.onCron, onCron);
}

/**
 * This function is to overcome a limitation of the `cron` package where the setTime function
 * checks if the time is an instance of CronTime. I think there's some odd behavior with the Remix
 * bundler where there are actually 2 instances of the class between the server and Remix.
 */
function setTime(job: CronJob, cron: string) {
    const wasRunning = job.running;
    job.stop();
    job.cronTime = new CronTime(cron, 'America/Denver');
    if (wasRunning) {
        job.start();
    }
}

/**
 * Converts a time string to a daily cron syntax.
 * @param time - String in the format `h:mm a`.
 * @returns String representation of a cron.
 * @example
 * ```typescript
 * toDailyCronSyntax('9:30 PM');
 * // -> 0 30 21 * * *
 * ```
 */
export function toDailyCronSyntax(time: string): string {
    const parts = time.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!parts) {
        throw new Error(`Failed to parse time: ${time}`);
    }
    let hours = parseInt(parts[1], 10);
    if (hours === 12 && parts[3] === 'AM') {
        hours = 0;
    } else if (hours < 12 && parts[3] === 'PM') {
        hours += 12;
    }
    const minutes = parseInt(parts[2], 10) || 0;
    return `0 ${minutes} ${hours} * * *`;
}
