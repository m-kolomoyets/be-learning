import type { ServerResponse } from "node:http";
import type { Handler, Route, Request } from "./lib/types.ts";
import {
  CAPTURE_GROUP_REGEX,
  DEFAULT_JSON_HEADERS,
  PATH_PARAM_PATTERN,
} from "./lib/constants.ts";

export class Router {
  private routes: Route[] = [];

  private convertPathToPattern(path: string) {
    const pathParams: string[] = [];
    const regexPattern = path.replace(PATH_PARAM_PATTERN, (_, paramName) => {
      pathParams.push(paramName);
      return CAPTURE_GROUP_REGEX;
    });

    return {
      pathParams,
      regexPattern,
    };
  }

  // TODO: Maybe additional checks and validations to add here
  private addRoute(method: Route["method"], path: string, handler: Handler) {
    const { pathParams, regexPattern } = this.convertPathToPattern(path);

    this.routes.push({
      method,
      pattern: new RegExp(`^${regexPattern}$`),
      pathParams,
      handler,
    });
  }

  private matchRoute(method: Route["method"], path: string) {
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

  private parseRequestUrl(req: Request) {
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );

    const pathname = url.pathname;
    const method = (req.method ?? "GET") as Route["method"];

    return {
      url,
      pathname,
      method,
    };
  }

  private parsePathParams(route: Route, pathname: string) {
    const params: Record<string, string> = {};

    const paramsMatches = pathname.match(route.pattern);

    if (!paramsMatches) {
      return params;
    }

    route.pathParams.forEach((param, index) => {
      params[param] = paramsMatches.at(index + 1)!;
    });

    return params;
  }

  private parseSearchParams(url: URL) {
    return Object.fromEntries(url.searchParams.entries());
  }

  // === METHODS ACCESSORS ===

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

  // === ROUTE EXECUTOR

  async handle(req: Request, res: ServerResponse) {
    const {url, pathname, method} = this.parseRequestUrl(req);

    const matchedRoute = this.matchRoute(method, pathname);

    if (!matchedRoute) {
      return this.notFound(res);
    }

    const pathParams = this.parsePathParams(matchedRoute, pathname);
    req.params = pathParams;

    const searchParams = this.parseSearchParams(url);
    req.searchParams = searchParams;

    await matchedRoute.handler(req, res);
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
      searchParams: req.searchParams
    }),
  );
});

router.get("/hello/:name", (req, res) => {
  res.writeHead(200, DEFAULT_JSON_HEADERS);
  res.end(
    JSON.stringify({
      message: "This is a /hello name route",
      params: req.params,
      searchParams: req.searchParams
    }),
  );
});

export const appHandler = (req: Request, res: ServerResponse) => {
  router.handle(req, res);
};
