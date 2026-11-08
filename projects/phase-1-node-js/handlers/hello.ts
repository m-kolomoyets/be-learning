import type { Handler } from '../lib/types.ts';
import { sendResponse } from '../lib/utils/sendResponse.ts';

export const helloHandler: Handler = (req, res) => {
    sendResponse(res, 200, { message: 'This is a /hello route' });
};

export const helloWithNameHandler: Handler = (req, res) => {
    sendResponse(res, 200, {
        message: `Hello, ${req.params?.name ?? 'user'}!. This is a /hello with name route`,
        params: req.params ?? {},
        searchParams: req.searchParams ?? {},
    });
};

export const postHelloHandler: Handler = (req, res) => {
    sendResponse(res, 200, {
        message: 'This is POST /hello route with JSON body sent into it',
        body: req.body ?? {},
    });
};
