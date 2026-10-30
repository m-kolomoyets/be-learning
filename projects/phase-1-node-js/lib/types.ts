import type { IncomingMessage, ServerResponse } from "node:http";

export type Request = IncomingMessage & {
  params?: Record<string, string>;
}

export type Handler = (
  req: Request,
  res: ServerResponse,
) => Promise<void> | void;

export type Route = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  pattern: RegExp;
  pathParams: string[];
  handler: Handler;
};
