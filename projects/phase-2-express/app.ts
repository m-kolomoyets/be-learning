import cors from 'cors';
import express from 'express';
import { notFound } from './lib/notFound.ts';
import { loggerMiddleware } from './middlewares/loggerMiddlweare.ts';
import { rootRouter } from './routes/index.ts';

export const createApp = () => {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(loggerMiddleware);

    app.use('/api', rootRouter);
    app.use(notFound);

    return app;
};
