import type { ServerResponse } from "node:http";
import type { Request } from "./lib/types.ts";

import { sendResponse } from "./lib/utils/sendResponse.ts";
import { Router } from "./lib/router.ts";
import router from "./routes/index.ts";



export const appHandler = (req: Request, res: ServerResponse) => {
  return router.handle(req, res);
};
