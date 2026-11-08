import type { Middleware } from '../lib/types.ts';

export const loggerMiddleware: Middleware = async (req, res, next) => {
    const routeMessage = `${req.method} ${req.url} ${res.statusCode}`;
    console.log(`Starting request: ${routeMessage}`);

    const start = performance.now();

    res.on('finish', () => {
        const ms = (performance.now() - start).toFixed(1);
        console.log(`${routeMessage} Time: ${ms}ms`);
    });

    await next();
};
