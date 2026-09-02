# ADR-002 — Single-host `docker compose` deploy, no Kubernetes

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The sibling project [`vortex`](../../../vortex) already demonstrates Kubernetes (k3s),
Helm, GitOps (ArgoCD), IaC and full observability. Repeating that here would add noise and
duplicate work. The supply-chain guarantees arcanex demonstrates — SBOM, vulnerability
scanning, signing, attestation, verify-before-run — are **identical regardless of the
runtime** the artifact lands on.

## Decision

Deploy the signed image to a single hardened host with `docker compose`. Hardening lives
in `deploy/compose/docker-compose.yml` (`read_only`, `cap_drop: [ALL]`,
`no-new-privileges`, digest-pinned image, `cosign verify` before `up`).

## Consequences

- Focus stays on the chain of custody, not orchestration.
- Clear contrast with `vortex` instead of overlap.
- No cluster to run or pay for; the whole story is demoable in ~3 minutes.
- If k8s admission-time verification is ever wanted, it is a documented stretch goal
  (sigstore `policy-controller`), not part of the core.
