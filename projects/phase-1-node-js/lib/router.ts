import type { ServerResponse } from "http";
import {
  PATH_PARAM_PATTERN,
  CAPTURE_GROUP_REGEX,
  CONTENT_TYPE_JSON,
} from "./constants.ts";
import type { Handler, Route, Request, Middleware } from "./types.ts";
import { sendResponse } from "./utils/sendResponse.ts";
import { compose } from "./utils/compose.ts";
import { parseJsonBody } from "./utils/parseJSONBody.ts";

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

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
    sendResponse(res, 404, {
      message: "Invalid route, seems it does not exist",
    });
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

  private async tryCatchWithStatus(
    res: ServerResponse,
    callback: () => Promise<void> | void,
    errorConfig: { status: number; message: string },
  ) {
    try {
      await callback();
    } catch (err) {
      const error = err as Error;
      sendResponse(res, errorConfig.status, {
        error: `${errorConfig.message}: ${error.message}`,
      });
    }
  }

  use(...middlewares: Middleware[]) {
    this.middlewares.push(...middlewares);
  }

  // === METHODS ACCESSORS ===

  get(path: string, ...fns: [...Middleware[], Handler]) {
    this.addRoute("GET", path, compose(fns));
  }

  post(path: string, ...fns: [...Middleware[], Handler]) {
    this.addRoute("POST", path, compose(fns));
  }

  put(path: string, ...fns: [...Middleware[], Handler]) {
    this.addRoute("PUT", path, compose(fns));
  }

  patch(path: string, ...fns: [...Middleware[], Handler]) {
    this.addRoute("PATCH", path, compose(fns));
  }

  delete(path: string, ...fns: [...Middleware[], Handler]) {
    this.addRoute("DELETE", path, compose(fns));
  }

  // === ROUTE EXECUTOR

  async handle(req: Request, res: ServerResponse) {
    const { url, pathname, method } = this.parseRequestUrl(req);

    const matchedRoute = this.matchRoute(method, pathname);

    if (!matchedRoute) {
      return this.notFound(res);
    }

    const pathParams = this.parsePathParams(matchedRoute, pathname);
    req.params = pathParams;

    const searchParams = this.parseSearchParams(url);
    req.searchParams = searchParams;

    if (req.headers["content-type"] === CONTENT_TYPE_JSON) {
      await this.tryCatchWithStatus(
        res,
        async () => {
          const body = await parseJsonBody(req);

          req.body = body;
        },
        {
          status: 400,
          message: "Invalid Request JSON",
        },
      );
    }

    await this.tryCatchWithStatus(
      res,
      async () => {
        const composedHandler = compose([
          ...this.middlewares,
          matchedRoute.handler,
        ]);

        await composedHandler(req, res);
      },
      {
        status: 500,
        message: "Internal Server Error",
      },
    );
  }
}
