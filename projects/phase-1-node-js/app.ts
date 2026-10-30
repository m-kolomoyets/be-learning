import { createServer } from "node:http";
import { sendResponse } from "./lib/utils/sendResponse.ts";
import router from "./routes/index.ts";

const PORT = 3000;
const HOSTNAME = "127.0.0.1";

const server = createServer((req, res) => {
  return router.handle(req, res);
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
