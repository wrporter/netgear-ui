import childProcess from 'node:child_process';
import { promisify } from 'node:util';

import { env } from './env.server';

const exec = promisify(childProcess.exec);

export interface PoeStatus {
    portId: string;
    power: boolean;
}

interface RcPoeStatus {
    poe_status: {
        'Port ID': string;
        'Port Name': string;
        Status: string;
        'PortPwr class': string;
        'Voltage (V)': string;
        'Current (mA)': string;
        'PortPwr (W)': string;
        'Temp. (°C)': string;
        'Error status': string;
    }[];
}

export async function login(): Promise<void> {
    await exec(
        `ntgrrc login --password ${env.NETGEAR_PASSWORD} --address ${env.NETGEAR_IP} --output-format=json --token-dir=./`,
    );
}

export async function tryWithLogin<T>(func: () => Promise<T>) {
    try {
        await portSettings();
        return await func();
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message.includes('login first') ||
                (error as any)?.stdout.includes('login first'))
        ) {
            await login();
            return func();
        }
        throw error;
    }
}

export async function portSettings(): Promise<void> {
    await exec(
        `ntgrrc port settings --address ${env.NETGEAR_IP} --output-format=json --token-dir=./`,
    );
}

export function poeStatus(): Promise<PoeStatus[]> {
    return tryWithLogin(async () => {
        const { stderr } = await exec(
            `ntgrrc poe status --address ${env.NETGEAR_IP} --output-format=json --token-dir=./`,
        );
        return (JSON.parse(stderr) as RcPoeStatus).poe_status.map(
            (poe) =>
                ({
                    portId: poe['Port ID'],
                    power: poe.Status === 'Delivering Power',
                }) as PoeStatus,
        );
    });
}

export async function disablePoePorts(): Promise<void> {
    return tryWithLogin(async () => {
        await exec(
            `ntgrrc poe set -p 3 -p 5 -p 7 --power disable --address ${env.NETGEAR_IP} --output-format=json --token-dir=./`,
        );
    });
}

export async function enablePoePorts(): Promise<void> {
    return tryWithLogin(async () => {
        await exec(
            `ntgrrc poe set -p 3 -p 5 -p 7 --power enable --address ${env.NETGEAR_IP} --output-format=json --token-dir=./`,
        );
    });
}
