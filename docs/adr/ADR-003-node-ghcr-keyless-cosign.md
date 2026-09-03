# ADR-003 — Node + npm app, GHCR registry, keyless cosign signing

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The project needs a language whose dependency manifests scanners understand well, a free
registry with no cloud account, and a signing scheme with no long-lived key material to
manage or leak.

## Decision

- **Node + npm.** `package-lock.json` (lockfileVersion 3) is a first-class citizen for
  `syft` (SBOM) and `trivy` (CVEs); the ecosystem also makes a realistic
  "known-CVE dependency" regression easy to exercise against the gate.
- **GHCR (`ghcr.io`).** Free, integrated with GitHub OIDC, no ECR/cloud account
  (`vortex` already covers ECR).
- **Keyless cosign.** Signing uses a short-lived certificate from Sigstore Fulcio, issued
  against the workflow's GitHub OIDC identity, logged in the Rekor transparency log. No
  private key is stored anywhere.

## Consequences

- No secret key to rotate, store, or leak; the signer identity *is* the workflow
  (`repo:owner/arcanex:ref:refs/heads/main`), verifiable by anyone.
- Requires `id-token: write` permission on the signing job for OIDC.
- Verification checks the certificate identity + issuer, not a pinned public key.
