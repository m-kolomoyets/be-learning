import { createServer, ServerResponse } from "node:http";
import { appHandler } from "./router.ts";
import type { Middleware, Request } from "./lib/types.ts";
import { loggerMiddleware } from "./middlewares/loggerMiddleware.ts";
import { compose } from "./lib/utils/compose.ts";
import { authMiddleware } from "./middlewares/authMiddleware.ts";

const PORT = 3000;
const HOSTNAME = "127.0.0.1";

const server = createServer(
  compose([loggerMiddleware, authMiddleware, appHandler]),
);

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
