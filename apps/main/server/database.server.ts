import { readFile, writeFile } from 'node:fs/promises';

import deepmerge from 'deepmerge';

import { env } from './env.server';

type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export interface Database {
    adminPassword: string;
    poe: {
        offCron: string;
        onCron: string;
        scheduleEnabled: boolean;
    };
}

const FILE_PATH = env.DATABASE_PATH;

export async function readDatabase(): Promise<Database> {
    return JSON.parse((await readFile(FILE_PATH)).toString());
}

export async function updateDatabase(update: DeepPartial<Database>): Promise<void> {
    const database = await readDatabase();
    const result = deepmerge(database, update);
    return writeFile(FILE_PATH, JSON.stringify(result, null, 2));
}

export async function initDatabase(): Promise<void> {
    try {
        await readDatabase();
    } catch {
        await writeFile(
            FILE_PATH,
            JSON.stringify(
                {
                    adminPassword: env.ADMIN_PASSWORD,
                    poe: {
                        // 9:30pm
                        offCron: '0 30 21 * * *',
                        // 6:30am
                        onCron: '0 30 6 * * *',
                        scheduleEnabled: true,
                    },
                } satisfies Database,
                null,
                2,
            ),
        );
    }
}

export async function isValidPassword(password: string) {
    const database = await readDatabase();
    return password === database.adminPassword;
}
