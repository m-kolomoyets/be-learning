import type { IncomingMessage } from "node:http";

export const parseRequestUrl = (req: IncomingMessage) => {
  return new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );
}
