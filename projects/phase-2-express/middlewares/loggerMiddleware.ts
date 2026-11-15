import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.ts';

export const loggerMiddleware = pinoHttp({
    logger,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    genReqId(req) {
        return req.headers['x-request-id'] ?? randomUUID();
    },
});
