import { createServer } from "node:http";
import { appHandler } from "./router.ts";
import { loggerMiddleware } from "./middlewares/loggerMiddleware.ts";
import { compose } from "./lib/utils/compose.ts";
import { authMiddleware } from "./middlewares/authMiddleware.ts";
import { sendResponse } from "./lib/utils/sendResponse.ts";

const PORT = 3000;
const HOSTNAME = "127.0.0.1";

const handler = compose([loggerMiddleware, authMiddleware, appHandler]);
const server = createServer((req, res) => {
  handler(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      sendResponse(res, 500, { error: "Internal Server Error" });
    } else {
      res.destroy();
    }
  });
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
