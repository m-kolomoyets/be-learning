import type { Middleware } from "../lib/types.ts";

export const loggerMiddleware: Middleware = async (req, res, next) => {
  console.log(`Starting request: ${req.url}`);

  await next();
};
