import { rootDbHandler } from '../handlers/db.ts';
import { externalUsersHandler } from '../handlers/external-api.ts';
import { downloadFileHandler, uploadFileHandler } from '../handlers/files.ts';
import { livenessHandler, readinessHandler } from '../handlers/health.ts';
import { helloHandler, helloWithNameHandler, postHelloHandler } from '../handlers/hello.ts';
import { protectedHandler } from '../handlers/protected.ts';
import { rootHandler } from '../handlers/root.ts';
import { Router } from '../lib/router.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { errorMiddleware } from '../middlewares/errorMiddleware.ts';
import { loggerMiddleware } from '../middlewares/loggerMiddleware.ts';
import { timeoutMiddleware } from '../middlewares/timeoutMiddleware.ts';

const router = new Router();

router.use(errorMiddleware, loggerMiddleware);

router.get('/', rootHandler);

router.get('/hello', helloHandler);
router.get('/hello/:name', helloWithNameHandler);
router.post('/hello', postHelloHandler);

router.get('/protected', authMiddleware, protectedHandler);

router.get('/db', rootDbHandler);

router.get('/file-download', downloadFileHandler);
router.post('/file-upload', uploadFileHandler);

router.get('/health', livenessHandler);
router.get('/health/ready', readinessHandler);

router.get('/external/users', timeoutMiddleware, externalUsersHandler);

export default router;
