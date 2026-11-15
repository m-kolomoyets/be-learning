import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/@http.ts';

export const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    res.status(status).json({
        success: false,
        message: status >= 500 ? 'Internal server error' : err.message,
    });
};
