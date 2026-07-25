# ─────────────────────────────────────────────
# easy-point-ui · Production image
# Multi-stage build → .next/standalone runtime
# ─────────────────────────────────────────────

# ── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next/font/google (app/layout.tsx) fetches font files at build time —
# this stage needs outbound internet access.
RUN pnpm build

# ── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
