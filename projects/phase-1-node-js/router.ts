import type { IncomingMessage, ServerResponse } from "node:http";
import type { Handler, Route } from "./lib/types.ts";
import { DEFAULT_JSON_HEADERS, PATH_PARAM_PATTERN } from "./lib/constants.ts";
import { parseRequestUrl } from "./lib/utils/parseRequestUrl.ts";
import { convertPathToPattern } from "./lib/utils/convertPathToPattern.1.ts";

export class Router {
  private routes: Route[] = [];

  // TODO: Maybe additional checks and validations to add here
  private addRoute(method: Route["method"], path: string, handler: Handler) {
    const { pathParams, regexPattern } = convertPathToPattern(path);

    this.routes.push({
      method,
      pattern: new RegExp(`^${regexPattern}$`),
      pathParams,
      handler,
    });
  }

  get(path: string, handler: Handler) {
    this.addRoute("GET", path, handler);
  }

  post(path: string, handler: Handler) {
    this.addRoute("POST", path, handler);
  }

  put(path: string, handler: Handler) {
    this.addRoute("PUT", path, handler);
  }

  patch(path: string, handler: Handler) {
    this.addRoute("PATCH", path, handler);
  }

  delete(path: string, handler: Handler) {
    this.addRoute("DELETE", path, handler);
  }

  matchRoute(method: Route["method"], path: string) {
    return this.routes.find((route) => {
      const isMethodMatch = route.method === method;
      const isPathnameMatch = !!path.match(route.pattern);

      return isMethodMatch && isPathnameMatch;
    });
  }

  private notFound(res: ServerResponse) {
    res.writeHead(404, DEFAULT_JSON_HEADERS);
    res.end(
      JSON.stringify({
        message: "Invalid route, seems it does not exist",
      }),
    );
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    const parsedUrl = parseRequestUrl(req);
    const pathname = parsedUrl.pathname;
    const method = (req.method ?? "GET") as Route["method"];

    const matchedRoute = this.matchRoute(method, pathname);

    if (!matchedRoute) {
      this.notFound(res);
    } else {
      await matchedRoute.handler(req, res);
    }
  }
}

const router = new Router();

router.get("/", (req, res) => {
  res.writeHead(200, DEFAULT_JSON_HEADERS);
  res.end(
    JSON.stringify({
      message: "This is a root route",
    }),
  );
});

router.get("/hello", (req, res) => {
  res.writeHead(200, DEFAULT_JSON_HEADERS);
  res.end(
    JSON.stringify({
      message: "This is a /hello route",
    }),
  );
});

router.get("/hello/:name", (req, res) => {
  res.writeHead(200, DEFAULT_JSON_HEADERS);
  res.end(
    JSON.stringify({
      message: "This is a /hello name route",
    }),
  );
});

export const appHandler = (req: IncomingMessage, res: ServerResponse) => {
  router.handle(req, res);
};
