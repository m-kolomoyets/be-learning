import pino from 'pino';
import { env } from '../config/env.ts';

export const logger = pino({
    transport: { target: 'pino-pretty' },
    level: env.LOG_LEVEL,
});
