# ---- builder ----
FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* are baked in AT BUILD TIME — see the gotcha in §10.1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Apex domain for per-workspace subdomain URLs (empty in staging — no wildcard there).
ARG NEXT_PUBLIC_ROOT_DOMAIN
ENV NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN
# Tenant root for the storefront: proxy.ts parses `{slug}.<this>` hosts into store
# slugs. Without it resolveStore() returns null and every shop shows "Store unavailable".
ARG NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN
ENV NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN=$NEXT_PUBLIC_STOREFRONT_ROOT_DOMAIN
# Custom domain → store slug JSON map (wired manually per merchant, see .env.example).
ARG NEXT_PUBLIC_CUSTOM_DOMAIN_MAP
ENV NEXT_PUBLIC_CUSTOM_DOMAIN_MAP=$NEXT_PUBLIC_CUSTOM_DOMAIN_MAP
# Build commit, shown next to the release in the user menu (version itself comes
# from package.json via next.config.mjs).
ARG NEXT_PUBLIC_GIT_SHA
ENV NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA
RUN pnpm build

# ---- runner ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
