# Phase 1 — Node.js mini-project: Mentor Audit

**Revision:** 2 (2026-10-30). Items fixed since revision 1 have been removed.  
**Scope:** `projects/phase-1-node-js/` (`app.ts`, `lib/*`, `middlewares/*`, `routes/*`, `handlers/*`, `app.js`)  
**Runtime checked:** Node v26.13.0, native TS type stripping (`node app.ts`)

Every finding marked **[verified]** was reproduced against the running server or in an isolated script.

---

## TL;DR

Good progress. The project structure (`lib` / `routes` / `handlers` / `middlewares`), the per-route middleware chain, and the global `router.use()` are now the right shape.

Open major issues:

1. **One malformed request crashes the server.** URL parsing runs outside any `try`, and `app.ts` doesn't catch the promise from `router.handle`. **[verified]**
2. **Auth can still be bypassed.** `authMiddleware` is now attached per route, but it still checks `PROTECTED_ROUTES` against the raw `req.url`. **[verified]**
3. **The token check accepts any value starting with `Bearer`.**
4. **Internal error messages are sent to clients.**

---

## ✅ What's good

- **Clear project layout.** Router class in `lib/router.ts`, route table in `routes/index.ts`, one file per handler group, one file per middleware.
- **Per-route middleware:** `router.get("/protected", authMiddleware, protectedHandler)`. Protection is declared next to the route and can differ by HTTP method. This is the Express/Koa-router model.
- **Global middleware via `router.use(...)`**, with the error middleware placed first so it wraps everything after it.
- **`compose` now propagates `next()`** (`return dispatch(i + 1)`). `await next()` really waits, and downstream errors reach upstream `try/catch`.
- **The logger uses `res.on("finish")`** and measures duration. That's the robust pattern.
- **`errorMiddleware` checks `res.headersSent`** and destroys the socket when it's too late to send a 500. That's the correct fallback.
- **Router internals:** paths compile to a `RegExp` once at registration, param names are collected, and `notFound` reuses `sendResponse`.
- **Strict tsconfig**, `127.0.0.1` binding, and `dist/` in `.gitignore`.

---

## 🔴 Major issues

### M1. One malformed request crashes the whole server [verified]

`lib/router.ts:51-55`, `lib/router.ts:115-122`, `app.ts:8-10`

```ts
const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
```

`new URL()` throws `ERR_INVALID_URL` on a bad `Host` header. For example:

```
printf 'GET / HTTP/1.1\r\nHost: a b\r\nConnection: close\r\n\r\n' | nc 127.0.0.1 3000
```

The throw happens in `handle()` **before** the `try` block and before `errorMiddleware` runs. `app.ts` returns the promise to `createServer`, which ignores it. The result is an unhandled rejection, and **the process exits**. After this request the dev server stopped responding.

This is a denial-of-service bug: any client can take the server down with one request.

**Fix, in two layers (both are needed):**

```ts
// 1. app.ts — last-resort safety net; never let a request kill the process
const server = createServer((req, res) => {
  router.handle(req, res).catch((error) => {
    console.error("Unhandled request error", error);
    if (!res.headersSent) sendResponse(res, 500, { error: "Internal Server Error" });
    else res.destroy();
  });
});
```

```ts
// 2. lib/router.ts — don't trust the Host header; it isn't needed for path parsing
const url = new URL(req.url ?? "/", "http://localhost");
```

Better still, see A1 below: run everything, including URL parsing and route matching, *inside* the composed chain so `errorMiddleware` covers it.

---

### M2. Auth bypass via path normalization is still open [verified]

`middlewares/authMiddleware.ts:6-9`, `lib/constants.ts:6`

`GET /./protected` (sent with `curl --path-as-is`) and `GET /x/../protected` return **200 with no token**.

The router matches the normalized `URL.pathname` (`/protected`). `authMiddleware` still compares the **raw** `req.url` against `PROTECTED_ROUTES`. `"/./protected".startsWith("/protected")` is false, so the middleware decides the route isn't protected and calls `next()`.

Now that auth is attached per route, the prefix check is not just redundant, it's the bug. **A middleware attached to a route doesn't need to ask whether the route is protected. Being attached already answers that.**

**Fix:** delete the prefix check and `PROTECTED_ROUTES`:

```ts
export const authMiddleware: Middleware = async (req, res, next) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    sendResponse(
      res,
      401,
      { message: "Unauthorized: Missing token" },
      { "WWW-Authenticate": "Bearer" },
    );
    return;
  }

  await next();
};
```

This snippet also fixes M3.

**General lesson:** run security checks on the same normalized value the router uses. Ideally, attach them to the matched route rather than to a string.

---

### M3. Token check accepts any value starting with `Bearer` [verified]

`middlewares/authMiddleware.ts:11-12`

`Authorization: Bearerxyz` and `Authorization: Bearer` (no token) both pass. Faking verification is fine for a learning project, but make the stub **shaped like a real check** so you can swap it later:

```ts
const user = await verifyToken(token); // stub now, JWT/session later
if (!user) return unauthorized(res);   // "invalid" vs "missing" token
req.user = user;                       // downstream handlers know *who*
```

Also:
- Send `WWW-Authenticate: Bearer` with 401 responses (RFC 6750).
- Remove the `as string` cast on `req.headers["authorization"]`. Node already types it as `string | undefined`, and the cast hides the `undefined`.

---

### M4. Internal error messages are sent to clients

`middlewares/errorMiddleware.ts:13`, `lib/router.ts:140-142`

```ts
sendResponse(res, 500, { error: `Internal Server Error: ${error.message}` });
```

`error.message` from internal code can contain SQL fragments, file paths, hostnames, or stack-derived details. Never send it to the client on a 5xx.

- Log the full error server-side: `console.error(err)`, which includes the stack (currently only `.message` is logged).
- Send a generic body to the client: `{ error: "Internal Server Error" }`.
- For *expected* errors, use an `HttpError` class whose message is meant to be public:

```ts
export class HttpError extends Error {
  constructor(public status: number, message: string, public expose = status < 500) {
    super(message);
  }
}
// errorMiddleware:
const status = err instanceof HttpError ? err.status : 500;
const message = err instanceof HttpError && err.expose ? err.message : "Internal Server Error";
```

> `erasableSyntaxOnly` forbids parameter properties (`public status` in the constructor), so declare the fields explicitly instead.

Also, `err as Error` is unsafe: anything can be thrown (`throw "x"`). Use `err instanceof Error ? err : new Error(String(err))`.

---

## 🟠 Architecture

### A1. Global middleware runs only after a route has matched

`lib/router.ts:115-136`

`handle()` parses the URL and matches the route first, then builds the chain `[...this.middlewares, route.handler]`. As a result:

- **404s are never logged**, and `errorMiddleware` never sees them.
- **Errors in parsing or matching** (see M1) aren't covered by `errorMiddleware`.
- Global middleware like CORS preflight, request ID, or rate limiting can't run on unmatched paths.
- Two layers both catch errors: `errorMiddleware` and the `try/catch` in `handle()`. The router's catch also lacks a `headersSent` check, so it can throw `ERR_HTTP_HEADERS_SENT`.

**Recommended shape:** make routing the *last middleware* of the global chain.

```ts
async handle(req: Request, res: ServerResponse) {
  const chain = compose([...this.middlewares, this.dispatchRoute]);
  await chain(req, res);
}

private dispatchRoute: Middleware = async (req, res) => {
  const { url, pathname, method } = this.parseRequestUrl(req);
  const matched = this.matchRoute(method, pathname);
  if (!matched) return this.notFound(res);

  req.params = this.parsePathParams(matched, pathname);
  req.searchParams = this.parseSearchParams(url);
  await matched.handler(req, res);
};
```

`errorMiddleware` then becomes the single place that handles errors, so you can remove the `try/catch` from `handle()`.

> Note the arrow-function field `dispatchRoute = async () => {}`. It keeps `this` bound when passed around, which is the same issue as the earlier `createServer(router.handle)` error.

### A2. The chain is re-composed on every request

`lib/router.ts:131-134`

`compose([...this.middlewares, matchedRoute.handler])` allocates a new array and closure on every request. It's cheap but unnecessary. Compose once, either lazily on the first `handle()` call or invalidated in `use()`. If you adopt A1, the global chain doesn't depend on the route at all, so it can be composed once.

### A3. Split `authenticate` from `authorize`

When you add real tokens:

- **authenticate** (global, optional): "who are you?" Parse the token if present and set `req.user`. It never rejects.
- **requireAuth / requireRole(role)** (per route): "are you allowed?" Respond 401/403.

This supports routes that are public but personalized when the user is logged in.

---

## 🟡 Minor fixes / nice to have

### Logger (`middlewares/loggerMiddleware.ts`)

- **Bug: the status code is captured too early.** `routeMessage` is built at the start, when `res.statusCode` is still the default `200`, so the `finish` log always shows `200`, even for 401/404/500. Read `res.statusCode` inside the `finish` callback.
- Also log `res.on("close")` when `!res.writableFinished`, to catch aborted requests.

### Router (`lib/router.ts`)

- **Path params aren't URL-decoded** [verified]. `/hello/J%C3%B6rg` returns `"J%C3%B6rg"`. Use `decodeURIComponent` in `parsePathParams`, wrapped in `try/catch`, and send 400 on malformed `%`.
- **Regex special characters in route paths aren't escaped.** `router.get("/file.json")` would match `/fileXjson`. Escape the literal parts (`s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`) before substituting params.
- **The regex runs twice per request** (`matchRoute` then `parsePathParams`). Have `matchRoute` return `{ route, match }` and reuse the match.
- **404 vs 405.** If the path matches but the method doesn't, return `405 Method Not Allowed` with an `Allow` header.
- **`HEAD` / `OPTIONS` unsupported.** `HEAD` should usually fall back to `GET` without a body. `OPTIONS` matters once you add CORS.
- **Unsafe method cast:** `(req.method ?? "GET") as Route["method"]`. A `TRACE` request is typed as valid. Validate it against `const METHODS = [...] as const`.
- **Trailing slash:** `/hello/` returns 404. Decide on a policy (strict, redirect, or tolerant).
- **Repeated query keys are lost** [verified]. `?a=1&a=2` gives `{ a: "2" }`. Expose `URLSearchParams` directly or build `Record<string, string | string[]>`.
- **Inconsistent error shape:** 404 and 401 return `{ message }`, while 500 returns `{ error }`. Pick one envelope, e.g. `{ error: { code: "NOT_FOUND", message: "..." } }`.
- `import type { ServerResponse } from "http"` should be `"node:http"`, as in the other files.
- No duplicate-route detection at registration (the `TODO` on line 24 is the right place for it).

### Types (`lib/types.ts`)

- `params?` and `searchParams?` are optional, so handlers write `req.params?.name ?? "user"`. Because the router always sets them, make them non-optional for handlers. One option is a `RoutedRequest` type; another is a `ctx` object (`{ req, res, params, query, user }`, as Koa and Hono do).
- `Middleware` and `Handler` are near-duplicates. Since `compose` already accepts a `Handler` as a `Middleware`, consider keeping only `Middleware`.

### `sendResponse` (`lib/utils/sendResponse.ts`)

- `content: Object` → `content: unknown`. The `Object` wrapper type is discouraged.
- Guard `if (res.headersSent) return;`.
- Use `Content-Type: application/json; charset=utf-8`, and optionally set `Content-Length: Buffer.byteLength(body)`.

### App / config (`app.ts`)

- `sendResponse` is imported but unused. That's TypeScript warning 6133; it becomes used once you add the `.catch` from M1.
- `PORT` and `HOSTNAME` are hard-coded. Read them from `process.env`; Node 26 supports `--env-file=.env`.
- No `server.on("error")`. `EADDRINUSE` crashes with a raw stack trace.
- Graceful shutdown: on `SIGINT`/`SIGTERM`, call `server.close()` and let in-flight requests finish.

### Repo hygiene

- **`app.js` is a stale Hello World build artifact** that doesn't match `app.ts`. Delete it.
- Root `package.json` has `"main": "node-js/app.js"`, a path that doesn't exist.
- `PATH_PARAM_PATTERN` has an unnecessary escape: `[a-zA-Z0-9\_]` → `[a-zA-Z0-9_]` (or `\w`).
- Handlers are missing trailing semicolons (`handlers/hello.ts`, `handlers/protected.ts`), and `handlers/root.ts` has commented-out debug code. Add Prettier to fix the formatting automatically.
- **No tests.** Use `node --test`, which is built in. Each bug in this audit is a 5–10 line regression test:
  - `compose`: ordering, error propagation, double `next()`.
  - Router: params, decoding, 404/405.
  - Integration: start the server on port `0`, then `fetch` `/./protected` (expect 401), send a bad `Host` (expect 400/500, server still alive), and send `Bearerxyz` (expect 401).

---

## Priority checklist

| # | Severity | Item | Effort |
|---|---|---|---|
| 1 | 🔴 Major | M1: `.catch` in `app.ts`; stop using the `Host` header in `new URL` | XS |
| 2 | 🔴 Major | M2 + M3: drop the `PROTECTED_ROUTES` check, strict `Bearer <token>` parsing, `WWW-Authenticate` | XS |
| 3 | 🔴 Major | M4: generic 5xx body, log the full error, `HttpError` for expected errors | S |
| 4 | 🟠 | A1: routing as the last global middleware; single error handler; 404s logged | S |
| 5 | 🟠 | Tests with `node --test`, including regressions for M1, M2, M3 | M |
| 6 | 🟡 | Logger status-code bug | XS |
| 7 | 🟡 | Decode params, escape regex literals, 405 + `Allow`, single regex match | S |
| 8 | 🟡 | Env config, `server.on("error")`, graceful shutdown | S |
| 9 | 🟡 | Delete `app.js`, fix `package.json` `main`, remove the unused import | XS |
| 10 | 🟡 | Types: non-optional `params`/`query`, `unknown` instead of `Object`, validated method | XS |

**Next learning step after these:** request body parsing (stream `req`, enforce a size limit, `JSON.parse` with a 400 on failure, check `Content-Type`), then input validation.
