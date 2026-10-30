import type { Handler } from "../lib/types.ts";
import { sendResponse } from "../lib/utils/sendResponse.ts";

export const protectedHandler: Handler = (req, res) => {
  sendResponse(res, 200, {
    message:
      "This is a /protected route. If you see this, you have the AuthToken in headers",
    searchParams: req.searchParams,
  });
}
