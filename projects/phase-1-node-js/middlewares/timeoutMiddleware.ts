import type { Middleware } from '../lib/types.ts';
import { ROUTE_TIMEOUT_MS } from '../lib/constants.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';

export const timeoutMiddleware: Middleware = async (req, res, next) => {
    const abortController = new AbortController();
    const abortSignal = AbortSignal.any([req.signal, abortController.signal]);
    req.abortSignal = abortSignal;

    const timer = setTimeout(() => {
        abortController.abort(new Error('Request timed out'));

        if (!res.headersSent) {
            sendResponse(
                res,
                504,
                {
                    message: 'Request timed out',
                },
                { Connection: 'close' }
            );
        }
    }, ROUTE_TIMEOUT_MS);

    try {
        await next();
    } catch (err) {
        if (abortSignal.aborted) {
            return;
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
};
