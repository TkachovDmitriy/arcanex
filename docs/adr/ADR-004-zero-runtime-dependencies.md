# ADR-004 — App has zero runtime dependencies in v0

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The pipeline must have a reliably green baseline: a run that passes every gate with no
CVEs and no policy violations. If the app carried third-party dependencies from day one,
the baseline could break for reasons unrelated to the pipeline (a new CVE published
upstream), making the demo flaky.

## Decision

The v0 application uses only the Node standard library — zero runtime dependencies. The
insecure scenario is *introduced deliberately* in the demo (see PLAN §4): a PR adds a
dependency with a known CVE (e.g. `lodash@4.17.19`) or hardcodes a secret, and the gate
blocks it.

## Consequences

- The baseline is offline-buildable and stays green independent of upstream CVE churn.
- The contrast between "green main" and "red vulnerable PR" is crisp and reproducible.
- When a dependency is eventually added, it is a conscious, reviewed event — exactly the
  behaviour the pipeline is meant to enforce.
