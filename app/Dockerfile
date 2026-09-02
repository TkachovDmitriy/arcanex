# syntax=docker/dockerfile:1

# ---- build stage -------------------------------------------------------------
# Full Node image: has npm, a shell, build tooling. Used only to install and
# validate dependencies against the lockfile. None of this ships to production.
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Copy manifests first so this layer is cached unless deps actually change.
COPY package.json package-lock.json ./

# `npm ci` installs *exactly* what the lockfile pins — reproducible builds.
# With zero runtime deps it installs nothing, but it still fails the build if
# package.json and the lockfile ever drift apart.
RUN npm ci --omit=dev

COPY src ./src

# ---- runtime stage -----------------------------------------------------------
# Distroless: no shell, no package manager, no busybox. Only the Node runtime
# and its libc. Tiny attack surface and far fewer CVEs to triage. `:nonroot`
# runs as UID 65532, never root. (Digest-pin this in a later phase.)
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src ./src

# The distroless :nonroot tag already runs as UID 65532, but declare it
# explicitly: it documents intent and satisfies scanners (trivy AVD-DS-0002).
USER 65532:65532

ENV NODE_ENV=production
EXPOSE 8080

# Distroless nodejs image's entrypoint is already `node`, so we pass the script.
CMD ["src/server.js"]
