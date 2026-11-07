import type { ServerResponse } from "node:http";
import { DEFAULT_JSON_HEADERS } from "../constants.ts";
import type { JsonObject } from "../types.ts";

export const sendResponse = (
  res: ServerResponse,
  status: number,
  content: JsonObject,
  headers?: Record<string, string>,
) => {
  res.writeHead(status, { ...DEFAULT_JSON_HEADERS, ...headers });
  res.end(JSON.stringify(content));
};
