# 🔏 arcanex

> A **secure software supply chain** in one repo — where the *pipeline that proves the
> artifact is safe* is the product, not the app it ships.

Every commit is scanned, every image gets an **SBOM**, is **vulnerability-scanned**, checked
against **policy-as-code**, then **signed** and **attested** before it is allowed to ship. A
malicious dependency or a leaked secret is **blocked at the gate**, not discovered in
production.

The application is deliberately minimal — the enforced **chain of custody from commit to
running container** is the substance. It ships to a single hardened host via `docker
compose`; the supply-chain guarantees are identical on any runtime, so Kubernetes is
intentionally out of scope (its platform concerns live in the sibling [`vortex`](../vortex)
project).

> **Status:** 🟢 Gate live — secret/IaC/vuln scanning + SBOM enforced on every push/PR.
> Next: policy-as-code, then signing. See the [roadmap](#-roadmap).

---

## The idea in one picture

```
   PR opened / push
        │
        ▼
 ┌───────────────┐   secrets in history?        ┌───────────────┐
 │  secret-scan  │ ── gitleaks ────────────────►│  ❌ block PR   │
 └──────┬────────┘                              └───────────────┘
        │ clean
        ▼
 ┌───────────────┐   Dockerfile / IaC misconfig?
 │   iac-scan    │ ── trivy config ────────────► SARIF → GitHub Security
 └──────┬────────┘
        │ clean
        ▼
 ┌──────────────────────────────────────────────┐
 │            build-scan-sign                    │
 │  docker build                                 │
 │   └─► syft        → SBOM (SPDX)               │
 │   └─► trivy image → CVE scan (fail HIGH/CRIT) │──► SARIF → GitHub Security
 │   └─► conftest    → OPA policy gate on SBOM   │
 │        ── on main only: ──                    │
 │   └─► cosign sign (keyless / OIDC)            │
 │   └─► cosign attest SBOM + provenance         │
 │   └─► push → ghcr.io                          │
 └──────────────────────┬───────────────────────┘
                        │ signed + attested
                        ▼
              single host: docker compose
              (verify signature before run)
```

## What each stage proves

| Stage | Tool | Guarantees |
|---|---|---|
| **secret-scan** | `gitleaks` | no credentials ever enter git history |
| **iac-scan** | `trivy config` | Dockerfile / compose have no known misconfigurations |
| **SBOM** | `syft` | a complete, machine-readable bill of materials per build |
| **vuln-scan** | `trivy image` | build fails on HIGH/CRITICAL fixable CVEs |
| **policy gate** | `conftest` (OPA/Rego) | org rules enforced as code (banned pkgs, licenses) |
| **sign** | `cosign` (keyless) | image provenance is cryptographically verifiable |
| **attest** | `cosign attest` | SBOM + build provenance travel *with* the image |

No long-lived keys: signing uses **keyless cosign** via GitHub OIDC → Sigstore.
No cloud account required: images live in **GHCR**.

## Failure modes the gate blocks

The pipeline is designed around what it must **refuse to ship**:

1. **Baseline** — `main` is green; the image is signed and its SBOM attested.
2. **Regression** — a change adds a dependency with a known CVE, or hardcodes a credential
   in the source.
3. **The gate holds** — the pipeline goes **red**: `trivy` flags the CVE / `gitleaks` flags
   the secret, and the merge is blocked. Nothing unsafe reaches the registry.

---

## Why no Kubernetes

`vortex` already proves the k8s/GitOps/observability story. Piling k8s on here would add
noise, not signal. The supply-chain guarantees are **identical whether the artifact runs
on k8s or a single VM** — so `arcanex` ships to one hardened host via `docker compose`,
keeping the spotlight on the **chain of custody from commit to running container**.

See [ADR-002](docs/adr/ADR-002-single-host-no-k8s-deploy.md).

---

## Roadmap

- [x] **Phase 0 — Scaffold:** repo, trivial TS app, Dockerfile (Chainguard/wolfi, non-root), ADRs
- [x] **Phase 1 — Gate:** gitleaks + trivy config + trivy image + SBOM, SARIF to GitHub Security
- [ ] **Phase 2 — Policy-as-code:** conftest/OPA policies on the SBOM (banned pkgs, licenses)
- [ ] **Phase 3 — Provenance:** keyless cosign sign + SBOM/provenance attestation → GHCR
- [ ] **Phase 4 — Deploy:** single hardened host, `cosign verify` before `docker compose up`
- [ ] **Phase 5 — Attack simulation:** an automated "vulnerable PR" check proving the gate
  blocks a known-CVE dependency and a hardcoded secret
- [ ] **Stretch:** SLSA build-level provenance (slsa-github-generator) · admission-time
  verification (policy-controller) · dependency review action · Renovate auto-PRs

---

## Repository structure

```
arcanex/
├── app/                     # the trivial service being secured
│   ├── src/server.ts        # TypeScript HTTP server (zero *runtime* deps)
│   ├── tsconfig.json        # compiled to dist/ in the image build stage
│   ├── package.json         # TypeScript is a devDependency only
│   └── Dockerfile           # multi-stage → Chainguard/wolfi, non-root, 0-CVE
├── policy/                  # OPA/Rego policies enforced by conftest
├── deploy/compose/          # single-host hardened docker-compose
├── docs/adr/                # architecture decision records
└── .github/workflows/
    └── supply-chain.yml     # the pipeline — the actual product
```

## Running locally

The app has **zero runtime dependencies** (TypeScript is a build-time devDependency):

```sh
cd app
npm ci          # installs the TS toolchain (dev only)
npm run build   # tsc → dist/
npm start       # node dist/server.js → http://localhost:8080
```

The full chain (SBOM, scan, sign) runs in CI; no local security tooling needed.
```
