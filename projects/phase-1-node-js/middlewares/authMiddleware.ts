import { DEFAULT_JSON_HEADERS, PROTECTED_ROUTES } from "../lib/constants.ts";
import type { Middleware } from "../lib/types.ts";

export const authMiddleware: Middleware = async (req, res, next) => {
  const isProtectedRoute =
    PROTECTED_ROUTES.findIndex((route) => {
      return req.url?.startsWith(route);
    }) !== -1;

  const authToken = req.headers["authorization"] as string;
  const isAuthTokenValid = !!authToken && authToken.startsWith("Bearer");

  if (isProtectedRoute && !isAuthTokenValid) {
    res.writeHead(401, DEFAULT_JSON_HEADERS);
    res.end(
      JSON.stringify({
        message: "Unauthorized: Missing token",
      }),
    );
    return;
  }

  await next();
};
