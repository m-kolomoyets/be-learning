import type { IncomingMessage, ServerResponse } from "node:http";

export const appHandler = (req: IncomingMessage, res: ServerResponse) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
}
