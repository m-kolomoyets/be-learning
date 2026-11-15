import { Router } from 'express';
import { healthRouter } from './health.ts';

export const rootRouter = Router();

rootRouter.use('/health', healthRouter);
