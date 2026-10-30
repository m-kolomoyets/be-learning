import { createServer } from "node:http";
import { appHandler } from "./router.ts";

const PORT = 3000;
const HOSTNAME = '127.0.0.1';


const server = createServer(appHandler);

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
