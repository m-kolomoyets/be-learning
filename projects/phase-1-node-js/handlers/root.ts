import type { Handler } from "../lib/types.ts";
import { sendResponse } from "../lib/utils/sendResponse.ts";

export const rootHandler: Handler = (req, res) => {
  sendResponse(res, 200, { message: "This is a root route" });
}
