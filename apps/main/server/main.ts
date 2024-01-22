import 'source-map-support/register';

import { installGlobals } from '@remix-run/node';
import { createRemixServer } from '@wesp-up/express-remix';

import { initCronJobs } from './cron.server';
import { initDatabase } from './database.server';

installGlobals();

async function main() {
    await initDatabase();
    await initCronJobs();

    const server = await createRemixServer();
    server.start(3000);
}

main();
