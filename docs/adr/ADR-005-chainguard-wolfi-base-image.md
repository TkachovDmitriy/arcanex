# ADR-005 — Chainguard (wolfi) runtime base instead of Google distroless

- **Status:** Accepted
- **Date:** 2026-09-03
- **Supersedes:** the distroless runtime choice implied by ADR-003

## Context

The runtime image originally used `gcr.io/distroless/nodejs22-debian12:nonroot`. The
supply-chain gate (`trivy image`, fixable HIGH/CRITICAL) then **blocked the baseline
build**: the distroless base shipped `libssl3 3.0.18` with 6 fixable OpenSSL CVEs
(1 CRITICAL — CVE-2026-31789, 5 HIGH), even though Debian had already published the fix
(`3.0.19`/`3.0.20`). Google had not yet rebuilt the distroless image, so we were stuck with
a vulnerable base we do not control — and the whole premise of arcanex is that such an
artifact must not ship.

## Decision

Use `cgr.dev/chainguard/node` (Chainguard, built on the **wolfi** undistro) for the runtime
stage. It is distroless-style (no shell, no package manager, nonroot UID 65532) but
**continuously rebuilt**, so OS packages stay patched — a fresh scan reports **0 known
CVEs**. Pin the base **by digest** for reproducible builds; a later Renovate config bumps
the digest as new patched images publish (see roadmap stretch goals).

The build stage keeps `node:22-bookworm-slim` (needs npm + the TypeScript toolchain); its
CVEs never ship because multi-stage discards it — only the wolfi runtime image is scanned.

## Consequences

- Baseline build is green again with a genuinely clean image, not a suppressed finding.
- No control over base rebuild cadence is traded for Chainguard's aggressive patching.
- Free tier exposes only the `:latest` tag (versioned tags are paid); digest pinning gives
  reproducibility despite that, and Renovate keeps it current.
- Image is slightly larger (~181 MB vs ~147 MB distroless) — an acceptable trade for a
  continuously-patched, near-zero-CVE base.
