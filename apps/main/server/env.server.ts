import { cleanEnv, str } from 'envalid';

export const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    ADMIN_PASSWORD: str(),
    DATABASE_PATH: str(),
    SESSION_SECRET: str(),
    NETGEAR_PASSWORD: str(),
    NETGEAR_IP: str(),
});
