# syntax=docker/dockerfile:1

# ---- build stage -------------------------------------------------------------
# Full Node image: has npm, a shell, build tooling. Compiles TypeScript here.
# None of this — not npm, not the TS toolchain, not node_modules — ships to prod.
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Copy manifests first so this layer is cached unless deps actually change.
COPY package.json package-lock.json ./

# `npm ci` installs *exactly* what the lockfile pins — reproducible builds.
# Includes devDependencies (TypeScript, @types/node) because we need them to
# compile. They live only in this throwaway stage.
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# tsc → dist/*.js. The runtime stage takes only this compiled output.
RUN npm run build

# ---- runtime stage -----------------------------------------------------------
# Chainguard (wolfi) node image: distroless-style (no shell, no package manager)
# but continuously rebuilt, so the OS packages stay patched — typically 0 known
# CVEs, unlike Google distroless whose openssl lagged behind Debian's fix.
# Pinned by digest for reproducible builds (Renovate bumps the digest — ADR-005).
FROM cgr.dev/chainguard/node:latest@sha256:105c8e7e503ea8f45553b9cc5aa0d24e80499bcc7c860dff54449e7c01d9be79 AS runtime

WORKDIR /app

# Only the compiled JS ships — no node_modules, no TypeScript, no sources.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist

# Chainguard already runs as the nonroot UID 65532; declare it explicitly to
# document intent and satisfy scanners (trivy AVD-DS-0002).
USER 65532:65532

ENV NODE_ENV=production
EXPOSE 8080

# The image entrypoint is /usr/bin/node, so CMD is just the script to run.
CMD ["dist/server.js"]
