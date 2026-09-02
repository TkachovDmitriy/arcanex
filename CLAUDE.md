# CLAUDE.md — arcanex

Guidance for Claude Code in this repository. **Read `docs/PLAN.md` first** — it is the
self-contained kickoff (scope, decisions, roadmap, next step).

## What this is

A **secure software supply chain** demo (DevSecOps portfolio piece). The shipped app is
trivial on purpose — the **pipeline** (`.github/workflows/supply-chain.yml`) is the product:
scan → SBOM → vuln-scan → policy gate → sign → attest → deploy to a single hardened host.

Sibling project [`vortex`](../vortex) is the platform/k8s piece. arcanex deliberately does
**not** duplicate it.

## Rules when working here

- **No Kubernetes, no cloud account.** Single-host `docker compose`; registry = GHCR;
  signing = **keyless cosign** (GitHub OIDC). See ADR-002 / ADR-003.
- **Decisions are ADRs.** Any meaningful choice → `docs/adr/ADR-NNN-*.md`.
- **Keep the baseline green.** The app stays dependency-free in v0; the *demo* introduces
  the vulnerable dependency (see `docs/PLAN.md` §4).
- **Least privilege in CI.** Default `permissions: contents: read`; elevate per-job only
  where needed (`packages: write`, `id-token: write`, `security-events: write`).
- **Git flow.** Work on `feat/*` branches; never commit to the default branch. Short
  Conventional-Commit subjects; no `Co-Authored-By` trailer.
- **NixOS host.** Commands target NixOS/Linux; prefer declarative install if any local
  tooling is ever needed (security tools normally run in CI, not locally).

## Layout

```
app/                 # trivial Node service being secured (+ distroless Dockerfile)
policy/              # OPA/Rego enforced by conftest
deploy/compose/      # single-host hardened docker-compose
docs/PLAN.md         # kickoff/handoff — start here
docs/adr/            # decision records
.github/workflows/supply-chain.yml   # the pipeline (the product)
```
