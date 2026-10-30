import { helloHandler, helloWithNameHandler } from "../handlers/hello.ts";
import { protectedHandler } from "../handlers/protected.ts";
import { rootHandler } from "../handlers/root.ts";
import { Router } from "../lib/router.ts";

const router = new Router();

router.get("/", rootHandler);

router.get("/hello", helloHandler);
router.get("/hello/:name", helloWithNameHandler);

router.get("/protected", protectedHandler);

export default router;
