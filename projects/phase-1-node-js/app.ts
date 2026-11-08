import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { DEFAULT_PORT } from './lib/constants.ts';
import router from './routes/index.ts';

dotenv.config();

const PORT = parseInt(process.env.PORT || DEFAULT_PORT + '');
const HOSTNAME = '127.0.0.1';

const server = createServer((req, res) => {
    return router.handle(req, res);
});

server.listen(PORT, HOSTNAME, () => {
    console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
