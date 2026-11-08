import type { IncomingMessage, ServerResponse } from 'node:http';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type Request = IncomingMessage & {
    params?: Record<string, string>;
    searchParams?: Record<string, string>;
    body?: JsonObject;
};

export type Middleware = (req: Request, res: ServerResponse, next: () => Promise<void> | void) => Promise<void> | void;

export type Handler = (req: Request, res: ServerResponse) => Promise<void> | void;

export type Route = {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    pattern: RegExp;
    pathParams: string[];
    handler: Handler;
};
