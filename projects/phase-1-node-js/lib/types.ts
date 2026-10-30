import type { IncomingMessage, ServerResponse } from "node:http";

export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void> | void;

// TODO: handle /:param/.. patterns
export type Route = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  pattern: RegExp;
  pathParams: string[];
  handler: Handler;
};
