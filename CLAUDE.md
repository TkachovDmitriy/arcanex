# CLAUDE.md — arcanex

Guidance for Claude Code in this repository. **Read `README.md` and `docs/adr/` first** for
scope and the decisions on record.

## What this is

A **secure software supply chain**. The shipped app is intentionally minimal — the
**pipeline** (`.github/workflows/supply-chain.yml`) is the product: scan → SBOM → vuln-scan
→ policy gate → sign → attest → deploy to a single hardened host.

Sibling project [`vortex`](../vortex) is the platform/k8s piece. arcanex deliberately does
**not** duplicate it.

## Rules when working here

- **No Kubernetes, no cloud account.** Single-host `docker compose`; registry = GHCR;
  signing = **keyless cosign** (GitHub OIDC). See ADR-002 / ADR-003.
- **Decisions are ADRs.** Any meaningful choice → `docs/adr/ADR-NNN-*.md`.
- **Keep the baseline green.** The app stays dependency-free; the known-CVE dependency is
  introduced only as a regression check against the gate (see ADR-004).
- **Least privilege in CI.** Default `permissions: contents: read`; elevate per-job only
  where needed (`packages: write`, `id-token: write`, `security-events: write`).
- **Git flow.** Work on `feat/*` branches; never commit to the default branch. Short
  Conventional-Commit subjects; no `Co-Authored-By` trailer.
- **NixOS host.** Commands target NixOS/Linux; prefer declarative install if any local
  tooling is ever needed (security tools normally run in CI, not locally).

## Layout

```
app/                 # minimal TypeScript service being secured (+ Chainguard Dockerfile)
policy/              # OPA/Rego enforced by conftest
deploy/compose/      # single-host hardened docker-compose
docs/adr/            # decision records
.github/workflows/supply-chain.yml   # the pipeline (the product)
```
