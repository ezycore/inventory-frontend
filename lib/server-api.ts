// coding-standard: maintained
/**
 * Two conventions every SERVER-side call to the backend shares — the storefront
 * reads (`lib/storefront-server.ts`) and the proxy's lookups
 * (`lib/storefront-page-lookup.ts`, `lib/storefront-domain-lookup.ts`). Kept free
 * of `next/headers` so the proxy can import it.
 *
 * Both answer the same incident (2026-10-23): this server renders every shop of
 * every merchant from ONE IP, so the backend's per-IP limiter put all shoppers of
 * all stores in one bucket; when it ran dry, its 429 was read as "no such store"
 * — subdomain shops drew 404s and a custom domain sent shoppers to `/login`.
 */

const SSR_KEY_HEADER = "x-ezycore-ssr-key";

/**
 * The header that exempts this server from the backend's global per-IP limiter
 * (`inventory-backend/src/utils/ssr-request.ts`).
 *
 * `SSR_API_KEY` is deliberately NOT `NEXT_PUBLIC_*`: it is a secret, read at
 * RUNTIME from the container's env (`.env.frontend`) by server code — the proxy
 * runs on Node in Next 16, as do server components and route handlers. In a
 * browser bundle it is simply undefined, so a stray client import sends nothing
 * rather than leaking it. Unset, nothing is sent and the backend counts this
 * server like anyone else — the behaviour before this existed.
 */
export const serverApiHeaders = (): Record<string, string> => {
  const key = process.env.SSR_API_KEY;
  return key ? { [SSR_KEY_HEADER]: key } : {};
};

/**
 * A status that says nothing about what was asked: a 5xx, a rate limit (429) or
 * a timeout (408). Every other 4xx IS the API's answer. Reading a 429 as an
 * answer is the bug this exists to stop.
 */
export const isNoAnswer = (status: number): boolean =>
  status >= 500 || status === 429 || status === 408;
