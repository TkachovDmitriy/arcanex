# ADR-001 — Scope is the secure supply chain; the app is intentionally trivial

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

arcanex is a DevSecOps portfolio piece. A realistic business application would draw
attention to feature logic and away from the thing being demonstrated: the chain of
custody that proves an artifact is safe from commit to running container.

## Decision

The shipped application is a zero-logic HTTP service. All engineering value lives in the
pipeline (`.github/workflows/supply-chain.yml`): scan → SBOM → vuln-scan → policy gate →
sign → attest → deploy.

## Consequences

- Reviewers evaluate the supply-chain guarantees, not app features.
- The app can stay dependency-free (see [ADR-004](ADR-004-zero-runtime-dependencies.md)),
  keeping a green offline baseline.
- Any "real" behaviour must be justified against this scope or rejected.
