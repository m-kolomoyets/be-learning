# Phase 1 — Node.js mini-project: Mentor Audit

**Date:** 2026-10-30  
**Scope:** `projects/phase-1-node-js/` (`app.ts`, `router.ts`, `middlewares/*`, `lib/*`, `app.js`)  
**Runtime checked:** Node v26.13.0, native TS type stripping (`node app.ts`)

Every finding marked **[verified]** was reproduced by running the code (curl against the server or a small script against `compose`).

---

## TL;DR

A good first framework-less server: you built your own router with path params, a Koa-style `compose`, and a single response helper. That's the right exercise, and the code is clean and readable.

There are **three major issues** to fix before building more on top of it:

1. **`compose` is broken.** `next()` doesn't return the downstream promise, so `await next()` doesn't wait, and errors downstream become unhandled rejections. That can crash the process. **[verified]**
2. **Auth can be bypassed.** The auth middleware checks raw `req.url`, but the router matches the *normalized* `URL.pathname`. `GET /./protected` or `GET /x/../protected` reaches the protected handler with no token. **[verified]**
3. **Route protection lives apart from the routes.** `PROTECTED_ROUTES` is a string-prefix list in `constants.ts` that runs before routing. That design causes issue 2, and it's fail-open: a new route is public unless you remember to add it to the list.

---

## ✅ What's good

- **Clear separation of concerns for a first pass.** Types live in `lib/types.ts`, constants in `lib/constants.ts`, helpers in `lib/utils`, and middlewares get their own folder.
- **Router design is the right mental model.** You compile path → `RegExp` once at registration (not per request), collect param names, and expose `get/post/put/patch/delete`. Express-style routers work the same way internally.
- **Koa-style `compose` with a `next()`-called-twice guard.** Knowing to add the `i <= index` guard shows you understood the onion model.
- **`sendResponse` utility.** One place sets the JSON headers and serializes the body. Good refactor (the recent commits).
- **Using `new URL(req.url, base)`** instead of hand-splitting on `?`. Correct and safe.
- **Handler errors are caught** in `Router.handle` and turned into a 500 instead of crashing.
- **Strict tsconfig** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly`). These are excellent defaults, and they let you run `.ts` directly on Node.
- **Binding to `127.0.0.1`** rather than `0.0.0.0` is a safe default for local dev.

---

## 🔴 Major issues

### M1. `compose` doesn't propagate the `next()` promise [verified]

`lib/utils/compose.ts:22-24`

```ts
currentMiddleware(req, res, () => {
  dispatch(i + 1);   // ← result discarded; returns undefined
}),
```

Effects:

- `await next()` resolves immediately, *before* downstream middlewares or the handler finish. Any "after" logic (timing, response logging, transactions, cleanup) runs too early.
  Test result: `a:before -> a:after`. The handler never ran inside the `await`.
- A throw or reject downstream is **not** propagated to the caller. It becomes an `unhandledRejection`, and on modern Node that **crashes the process**.
  Test result: `UNHANDLED: boom`.
- The "`next() called multiple times`" rejection is swallowed the same way, so the guard never actually reports anything.
- `app.ts` passes `compose(...)` to `createServer`, which ignores the returned promise. Even a correct `compose` needs a top-level `.catch`.
- `appHandler` (`router.ts:167`) calls `router.handle(req, res)` without `return`/`await`. That breaks the chain too.

**Fix:**

```ts
export const compose = (middlewares: Middleware[]) => {
  return (req: Request, res: ServerResponse): Promise<void> => {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const mw = middlewares[i];
      if (!mw) return;
      await mw(req, res, () => dispatch(i + 1)); // ← return the promise
    };

    return dispatch(0);
  };
};
```

```ts
// router.ts
export const appHandler = (req: Request, res: ServerResponse) =>
  router.handle(req, res); // return it

// app.ts
const handler = compose([errorMiddleware, loggerMiddleware, appHandler]);
createServer((req, res) => {
  handler(req, res).catch((err) => {
    console.error(err);
    if (!res.headersSent) sendResponse(res, 500, { error: "Internal Server Error" });
    else res.destroy();
  });
});
```

Also add an **error-handling middleware** as the first item in the chain (`try { await next() } catch {...}`). Then error handling lives in one place instead of only inside the router.

---

### M2. Auth bypass via path normalization mismatch [verified]

`middlewares/authMiddleware.ts:6-9` vs `router.ts:56-62`

Auth checks `req.url.startsWith("/protected")` on the **raw** URL. The router matches on `new URL(...).pathname`, which **normalizes dot-segments**:

| Request (sent with `curl --path-as-is`) | Auth sees | Router matches | Result |
|---|---|---|---|
| `GET /protected` | `/protected` ✔ protected | `/protected` | 401 ✅ |
| `GET /./protected` | not a prefix match → **public** | `/protected` | **200, no token ❌** |
| `GET /x/../protected` | not a prefix match → **public** | `/protected` | **200, no token ❌** |
| `GET /protected-admin` | prefix match → protected | 404 | 401 (over-matching, leaks nothing but wrong) |

This is a classic bug class: two components parse the same input differently. Security checks must run on **the same normalized value the router uses**. Ideally they attach to the **matched route**, not to a string.

**Fix:** see the "Route protection" section below. Short-term patch: parse once (e.g. in a first middleware that stores `req.pathname`), then compare whole path segments (`pathname === r || pathname.startsWith(r + "/")`).

---

### M3. Token "validation" accepts anything starting with `Bearer` [verified]

`middlewares/authMiddleware.ts:11-12`

```ts
const isAuthTokenValid = !!authToken && authToken.startsWith("Bearer");
```

`Authorization: Bearerxyz` and `Authorization: Bearer` (no token) both pass. Faking verification is fine for a learning project, but make the stub **shaped like a real check** so you can swap it later:

```ts
const header = req.headers.authorization;           // already typed string | undefined
const [scheme, token] = header?.split(" ") ?? [];
if (scheme !== "Bearer" || !token) return unauthorized(res);

const user = await verifyToken(token);              // stub now, JWT/session later
if (!user) return unauthorized(res);
req.user = user;                                    // downstream handlers know *who*
```

Also: send `WWW-Authenticate: Bearer` with 401 responses (RFC 6750), and use different messages for "missing" vs "invalid" tokens.

---

## 🟠 Architectural review: middleware, auth, and route protection

### Current shape

```
createServer
  └─ compose([logger, auth, appHandler])
                 │       └─ router.handle → match → handler
                 └─ checks PROTECTED_ROUTES (string prefixes) on raw req.url
```

Problems with this shape:

1. **Global middleware doesn't know which route matched.** Auth runs before routing, so it has to re-guess the route from a string. That causes the duplication and the bypass in M2.
2. **Fail-open.** A new protected route is public until someone edits `constants.ts`. Security defaults should be fail-closed, or at least declared *next to* the route.
3. **Two sources of truth** for route paths: `router.get("/protected", …)` and `PROTECTED_ROUTES = ["/protected"]`.
4. **Method-blind.** You can't protect `POST /posts` while leaving `GET /posts` public.

### Recommended: per-route middleware (Express/Koa-router style)

Let the router accept a middleware chain per route and reuse your `compose`:

```ts
// types.ts
export type Route = {
  method: Method;
  pattern: RegExp;
  pathParams: string[];
  chain: Handler; // composed middlewares + handler
};

// router.ts
get(path: string, ...fns: [...Middleware[], Handler]) {
  this.addRoute("GET", path, compose(fns as Middleware[]));
}

// routes.ts
router.get("/hello/:name", helloHandler);
router.get("/protected", requireAuth, protectedHandler);
router.delete("/posts/:id", requireAuth, requireRole("admin"), deletePost);
```

Benefits: protection sits next to the route, runs after normalization and matching, and can be per-method. Composable guards (`requireAuth`, `requireRole`, `validate(schema)`) are what you'll meet in Express, Fastify (`preHandler`), NestJS (Guards), and Hono.

### Alternative: route groups / sub-routers

When many routes share protection:

```ts
const api = new Router({ prefix: "/api" });
const admin = new Router({ prefix: "/admin", middlewares: [requireAuth, requireRole("admin")] });
router.use(api);
router.use(admin);
```

### Alternative: route metadata (declarative)

```ts
router.get("/protected", handler, { auth: true });
// in handle(): if (route.meta.auth) await requireAuth(...)
```

Simpler to start with but less flexible. Per-route middleware is the recommended path.

### What stays global

Things that apply to *every* request and don't depend on the route stay in the global `compose`: error handler, request logger, request ID, CORS, body-size limits. A good order:

```
errorHandler → requestId → logger → (cors) → router.handle → [per-route: auth → validate → handler]
```

### `authenticate` vs `authorize`

Split them:

- **authenticate** (optionally global): "who are you?" Parse the token if present and set `req.user`. It never rejects on its own.
- **authorize / requireAuth** (per-route): "are you allowed?" Reject with 401/403.

This also supports routes that are public but personalized when logged in.

---

## 🟡 Minor fixes / nice to have

### Router (`router.ts`)

- **Split the file.** `router.ts` holds the `Router` class, the route definitions, and `appHandler`. Suggested layout: `lib/router.ts` (class), `routes/index.ts` (definitions), `handlers/*.ts` (handler functions).
- **Path params aren't URL-decoded** [verified]. `/hello/J%C3%B6rg` returns `"J%C3%B6rg"`. Use `decodeURIComponent` in `parsePathParams`, wrapped in `try/catch`, and send 400 on malformed `%`.
- **Regex special characters in route paths aren't escaped.** `router.get("/file.json")` would match `/fileXjson`. Escape the literal parts (`str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`) before substituting params.
- **Regex runs twice per request** (`matchRoute` then `parsePathParams`). Have `matchRoute` return `{ route, match }` and reuse the match.
- **404 vs 405.** If the path matches but the method doesn't, return `405 Method Not Allowed` with an `Allow` header.
- **`HEAD` / `OPTIONS` unsupported.** `HEAD` should usually fall back to `GET` without a body. `OPTIONS` matters once you add CORS.
- **Unsafe method cast:** `(req.method ?? "GET") as Route["method"]`. A `TRACE` request is typed as a valid method. Validate it against a `const METHODS = [...] as const` set.
- **Trailing slash:** `/hello/` returns 404. Decide on a policy (strict, redirect, or tolerant).
- **`notFound` duplicates `sendResponse`.** Use `sendResponse(res, 404, …)`.
- **Inconsistent error shape:** 404 returns `{ message }`, 500 returns `{ error }`, 401 returns `{ message }`. Pick one envelope, e.g. `{ error: { code: "NOT_FOUND", message: "..." } }`.
- **Query params lose repeated keys** [verified]. `?a=1&a=2` gives `{ a: "2" }`. Either expose the `URLSearchParams` directly or build `Record<string, string | string[]>`.
- The `catch (error)` in `handle` swallows the error without logging it, which makes debugging hard. Log it, and check `res.headersSent` before writing a 500 (otherwise `ERR_HTTP_HEADERS_SENT`).
- No duplicate-route detection on registration (the `TODO` on line 26 is the right place for it).

### Types (`lib/types.ts`)

- `params?` and `searchParams?` are optional, so every handler has to write `req.params?.name ?? "user"`. Because the router always sets them, make them non-optional on the request the handler receives. One option: a distinct `RoutedRequest` type, or a `ctx` object (`{ req, res, params, query, user }`, as Koa and Hono do).
- `Middleware` and `Handler` are near-duplicates. `Handler` can be `Middleware` with `next` unused, or the router can type the last element explicitly.
- Mutating `IncomingMessage` is how Express does it, and it's fine. Just keep it to one documented place.

### `sendResponse` (`lib/utils/sendResponse.ts`)

- `content: Object` → `content: unknown`. The `Object` wrapper type is discouraged (ESLint `ban-types`).
- Guard `if (res.headersSent) return;`, or log it.
- Consider `res.end(body)` with an explicit `Content-Length: Buffer.byteLength(body)`.
- Add `charset=utf-8` to `Content-Type`.

### Logger (`middlewares/loggerMiddleware.ts`)

It only logs the start and the URL. Once M1 is fixed, log on completion:

```ts
export const loggerMiddleware: Middleware = async (req, res, next) => {
  const start = performance.now();
  res.on("finish", () => {
    const ms = (performance.now() - start).toFixed(1);
    console.log(`${req.method} ${req.url} ${res.statusCode} ${ms}ms`);
  });
  await next();
};
```

`res.on("finish")` works even with the current broken `compose`. It's the more robust pattern either way.

### App / config (`app.ts`)

- `PORT` and `HOSTNAME` are hard-coded. Read them from `process.env` (`process.env.PORT ?? 3000`). Node 26 has `--env-file=.env` built in.
- No `server.on("error")` handler. `EADDRINUSE` crashes with a raw stack trace. Handle it with a clear message.
- Graceful shutdown: on `SIGINT`/`SIGTERM`, call `server.close()` and let in-flight requests finish.
- Consider process-level `unhandledRejection`/`uncaughtException` logging as a last resort (log and exit, don't swallow).

### Repo hygiene

- **`app.js` is a stale artifact** of an older Hello World `tsc` build. It doesn't match `app.ts` and is confusing. Delete it. `tsconfig` already emits to `dist/`, so add `dist/` to `.gitignore`.
- Root `package.json` has `"main": "node-js/app.js"`, a path that doesn't exist.
- `PATH_PARAM_PATTERN` has an unnecessary escape: `[a-zA-Z0-9\_]` → `[a-zA-Z0-9_]` (or `\w`).
- `authMiddleware.ts:11` has a redundant cast: `req.headers["authorization"] as string`. Node already types `req.headers.authorization` as `string | undefined`, and the cast hides the `undefined`.
- **No tests.** Node has a built-in runner, so you don't need Jest. Start with `node --test`: unit-test `compose` (ordering, errors, double `next`) and the router (params, 404/405, decoding), then add integration tests that start the server on port `0` and use `fetch`. The M1 and M2 bugs would each have been caught by a 5-line test.

---

## Suggested target structure

```
phase-1-node-js/
├── app.ts                    # bootstrap: config, createServer, shutdown
├── config.ts                 # env parsing
├── lib/
│   ├── router.ts             # Router class (per-route middleware, 404/405)
│   ├── compose.ts
│   ├── http.ts               # sendResponse, sendError, HttpError class
│   └── types.ts
├── middlewares/
│   ├── errorHandler.ts       # global, first in chain
│   ├── logger.ts             # global
│   ├── authenticate.ts       # global, optional: sets req.user
│   └── requireAuth.ts        # per-route guard
├── routes/
│   └── index.ts              # router.get("/protected", requireAuth, handler)
├── handlers/
│   └── hello.ts
└── test/
    ├── compose.test.ts
    ├── router.test.ts
    └── app.test.ts
```

An `HttpError` class (`throw new HttpError(404, "User not found")`) together with the global error middleware lets handlers `throw` instead of hand-writing error responses.

---

## Priority checklist

| # | Severity | Item | Effort |
|---|---|---|---|
| 1 | 🔴 Major | Fix `compose` (`return dispatch(i + 1)`, async), return the promise from `appHandler`, add `.catch` in `createServer` | S |
| 2 | 🔴 Major | Move auth to per-route middleware on the normalized/matched route; remove `PROTECTED_ROUTES` | M |
| 3 | 🔴 Major | Make token parsing strict (`scheme === "Bearer" && token`), stub `verifyToken`, set `req.user`, add `WWW-Authenticate` | S |
| 4 | 🟠 | Global error middleware + `HttpError` + one consistent error envelope | S |
| 5 | 🟠 | Tests with `node --test` for compose, router, and the auth bypass regression | M |
| 6 | 🟡 | Decode params, escape regex literals, 405 + `Allow`, single regex match | S |
| 7 | 🟡 | Logger on `finish` with method/status/duration | XS |
| 8 | 🟡 | Env config, `server.on("error")`, graceful shutdown | S |
| 9 | 🟡 | Delete `app.js`, fix `package.json` `main`, split `router.ts` into class/routes/handlers | XS |
| 10 | 🟡 | Types: non-optional `params`/`query`, `unknown` instead of `Object`, validated method | XS |

**Next learning step after these:** request body parsing (stream `req`, enforce a size limit, `JSON.parse` with a 400 on failure, check `Content-Type`), then input validation. That's where most real-world backend bugs live.
