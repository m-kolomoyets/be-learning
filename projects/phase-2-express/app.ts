import cors from 'cors';
import express from 'express';
import { notFound } from './lib/notFound.ts';
import { errorHandlerMiddleware } from './middlewares/errorHandlerMiddleware.ts';
import { loggerMiddleware } from './middlewares/loggerMiddleware.ts';
import { rootRouter } from './routes/index.ts';

export const createApp = () => {
    const app = express();

    app.disable('x-powered-by');

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(loggerMiddleware);

    app.use('/api', rootRouter);
    app.use(errorHandlerMiddleware);
    app.use(notFound);

    return app;
};
