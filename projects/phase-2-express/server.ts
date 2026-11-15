import { createApp } from './app.ts';
import { env } from './lib/env.ts';
import { logger } from './lib/logger.ts';

const app = createApp();

const server = app.listen(env.PORT, (err) => {
    if (err) {
        logger.fatal({ err }, 'failed to start');
        process.exit(1);
    }
    logger.info(`Listening on :${env.PORT}`);
});

const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => {
        process.exit(0);
    }); // close DB pool here later
    setTimeout(() => {
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (err) => {
    logger.fatal({ err }, 'unhandledRejection');
    process.exit(1);
});
