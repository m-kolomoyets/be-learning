import type { ServerResponse } from "node:http";
import type { Middleware, Request } from "../types.ts";

export const compose = (middlewares: Middleware[]) => {
  return (req: Request, res: ServerResponse) => {
    let index = -1;

    const dispatch = (i: number): Promise<void> => {
      if (i <= index) {
        return Promise.reject(new Error("next() called multiple times"));
      }

      index = i;
      const currentMiddleware = middlewares[i];

      if (!currentMiddleware) {
        return Promise.resolve();
      }

      try {
        return Promise.resolve(
          currentMiddleware(req, res, () => {
            return dispatch(i + 1);
          }),
        );
      } catch (err) {
        return Promise.reject(err);
      }
    };

    return dispatch(0);
  };
};
