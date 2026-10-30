import type { IncomingMessage, ServerResponse } from "node:http";
import type { Handler, Route } from "./lib/types.ts";
import { DEFAULT_JSON_HEADERS } from "./lib/constants.ts";
import { parseRequestUrl } from "./lib/utils/parseRequestUrl.ts";


export class Router {
  private routes: Route[] = [];

  // TODO: Maybe additional checks and validations to add here
  private addRoute(method: Route["method"], path: string, handler: Handler) {
    this.routes.push({
      method,
      path,
      params: [],
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

  // TODO: add params matcher
  matchRoute(method: Route["method"], path: string) {
    return this.routes.find((route) => {
      const isMethodMatch = route.method === method;
      const isPathnameMatch = route.path === path;

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

export const appHandler = (req: IncomingMessage, res: ServerResponse) => {
  router.handle(req, res);
};
