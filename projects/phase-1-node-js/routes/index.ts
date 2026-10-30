import { helloHandler, helloWithNameHandler } from "../handlers/hello.ts";
import { protectedHandler } from "../handlers/protected.ts";
import { rootHandler } from "../handlers/root.ts";
import { Router } from "../lib/router.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { errorMiddleware } from "../middlewares/errorMiddleware.ts";
import { loggerMiddleware } from "../middlewares/loggerMiddleware.ts";

const router = new Router();

router.use(errorMiddleware, loggerMiddleware);

router.get("/", rootHandler);

router.get("/hello", helloHandler);
router.get("/hello/:name", helloWithNameHandler);

router.get("/protected", authMiddleware, protectedHandler);

export default router;
