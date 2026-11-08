import type { Middleware } from '../lib/types.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';

export const errorMiddleware: Middleware = async (req, res, next) => {
    try {
        await next();
    } catch (err) {
        const error = err as Error;

        console.error(`Error throws during route call: `, error.message);

        if (!res.headersSent) {
            sendResponse(res, 500, {
                error: `Internal Server Error: ${error.message}`,
            });
        } else {
            res.destroy();
        }
    }
};
