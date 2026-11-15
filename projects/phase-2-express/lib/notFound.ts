import type { RequestHandler } from 'express';

export const notFound: RequestHandler = (req, res) => {
    res.status(404).json({
        message: 'Oops, route not found',
    });
};
