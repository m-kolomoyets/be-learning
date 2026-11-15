import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.ts';

export const loggerMiddleware = pinoHttp({
    logger,
});
