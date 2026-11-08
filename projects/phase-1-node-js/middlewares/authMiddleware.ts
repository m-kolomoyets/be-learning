import type { Middleware } from '../lib/types.ts';
import { PROTECTED_ROUTES } from '../lib/constants.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';

export const authMiddleware: Middleware = async (req, res, next) => {
    const isProtectedRoute =
        PROTECTED_ROUTES.findIndex((route) => {
            return req.url?.startsWith(route);
        }) !== -1;

    const authToken = req.headers['authorization'] as string;
    const isAuthTokenValid = !!authToken && authToken.startsWith('Bearer');

    if (isProtectedRoute && !isAuthTokenValid) {
        sendResponse(res, 401, {
            message: 'Unauthorized: Missing token',
        });
        return;
    }

    await next();
};
