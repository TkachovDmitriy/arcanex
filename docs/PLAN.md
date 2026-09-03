# arcanex — plan & handoff

> Self-contained kickoff doc. Read this first in a fresh session. It captures **what
> arcanex is, why, the decisions already made, and the exact next steps** — no prior
> conversation needed.

## 1. What this project is

A **secure software supply chain** demonstrated end to end. The shipped app is trivial on
purpose; the **product is the pipeline** that proves the artifact is safe: scan → SBOM →
vuln-scan → policy gate → sign → attest → deploy. A leaked secret or a vulnerable
dependency is **blocked at the gate**, not found in prod.

Positioning: this is the **DevSecOps / security** portfolio piece. Its sibling
[`vortex`](../vortex) (near-final) already covers platform engineering deeply —
microservices, **Kubernetes (k3s) + Helm**, IaC (OpenTofu/AWS), GitOps (ArgoCD), full
observability (LGTM), CI (Actions OIDC→ECR). `vortex` left `cosign/SBOM enforcement` as an
unfinished *stretch* — **arcanex is that gap, done properly as its own focused artifact.**

**Design constraints (deliberate, to avoid duplicating vortex):**
- **No Kubernetes.** Deploy to a single hardened host via `docker compose`. The
  supply-chain guarantees are identical regardless of runtime; k8s here would be noise.
- **No cloud account.** Registry = **GHCR** (`ghcr.io`), not ECR (vortex already shows ECR).
- **Fast to demo.** Whole story must be showable in ~3 minutes.

## 2. Decisions already made (write these up as ADRs)

| # | Decision | Why |
|---|---|---|
| ADR-001 | Scope = secure supply chain; app is intentionally trivial | value is in the chain of custody, not business logic |
| ADR-002 | Single-host `docker compose` deploy, **no k8s** | guarantees are runtime-agnostic; keeps focus, contrasts vortex |
| ADR-003 | **Node + npm** app, **GHCR** registry, **keyless cosign** | npm lockfiles are best understood by scanners; GHCR is free; OIDC keyless = no long-lived keys |
| ADR-004 | App is **zero runtime dependencies** in v0 | guarantees an offline, always-green baseline; the demo *introduces* a vulnerable dep |

## 3. The pipeline (the actual deliverable)

GitHub Actions workflow `.github/workflows/supply-chain.yml`, least-privilege token,
three jobs:

1. **secret-scan** — `gitleaks` on full history (`fetch-depth: 0`).
2. **iac-scan** — `trivy config` on Dockerfile + compose → SARIF to GitHub Security tab.
3. **build-scan-sign** (needs 1 & 2):
   - `docker build` (load locally, don't push yet)
   - `syft` → SBOM (SPDX JSON)
   - `trivy image` → CVE scan, **fail on HIGH/CRITICAL fixable**, SARIF upload
   - `conftest` → OPA/Rego policy gate on the SBOM (banned pkgs, copyleft licenses)
   - **only on `main`:** GHCR login → `docker push` → `cosign sign` (keyless) →
     `cosign attest` SBOM + provenance

Permissions needed on the signing job: `contents: read`, `packages: write`,
`id-token: write` (OIDC for cosign), `security-events: write` (SARIF).

## 4. The 3-minute demo (this is what sells it)

1. `main` green: image signed, SBOM attested in GHCR.
2. Open a PR that **adds a dependency with a known CVE** (e.g. `lodash@4.17.19` —
   prototype pollution, fixed in 4.17.21) **or hardcodes an API key**.
3. PR pipeline goes **red**: trivy flags the CVE / gitleaks flags the secret; merge blocked.
Document with screenshots in `docs/` (Phase 5).

## 5. Roadmap (build in this order)

- [x] **Phase 0 — Scaffold:** repo, README, this plan, dirs, ADR-001..005
- [x] **Phase 1 — App + image:** TypeScript service (`app/src/server.ts`, zero *runtime*
  deps — TS is dev-only), multi-stage `Dockerfile` → **Chainguard/wolfi** nonroot (0-CVE,
  ADR-005). `npm run build` + `docker build` verified.
- [x] **Phase 2 — Gate jobs:** secret-scan (gitleaks) + iac-scan (trivy config) +
  build-scan (SBOM SPDX+CycloneDX via syft, trivy image), SARIF uploads. Green run on `main`.
- [ ] **Phase 3 — Policy-as-code:** `policy/image.rego` (deny malicious pkgs like
  `event-stream`/`flatmap-stream`; warn on GPL/AGPL) + `conftest test` step.
- [ ] **Phase 4 — Sign + attest:** GHCR push, keyless `cosign sign`, `cosign attest`
  SBOM + provenance; gate these behind `if: github.ref == 'refs/heads/main'`.
- [ ] **Phase 5 — Deploy + demo:** hardened `deploy/compose/docker-compose.yml`
  (`read_only`, `cap_drop: [ALL]`, `no-new-privileges`, digest-pinned image),
  a `cosign verify` step before `up`, and the vulnerable-PR demo with screenshots.
- [ ] **Stretch:** SLSA build provenance (`slsa-github-generator`) · admission-time verify
  (sigstore `policy-controller`) · `dependency-review-action` · Renovate.

## 6. Immediate next step

Start **Phase 1**: write the zero-dependency Node server, `package.json`,
a minimal `lockfileVersion: 3` `package-lock.json`, and the distroless multi-stage
`Dockerfile`. Then confirm it runs and builds. Everything else layers on top.

## 7. Environment notes

- Local toolchain has `git`, `docker`, `node`/`bun`. It does **not** have
  `syft`/`trivy`/`cosign`/`conftest`/`gitleaks` — and doesn't need them: they run in CI.
- Machine is NixOS. If local security-tool runs are ever wanted, add them declaratively.
- Repo currently on branch `feat/scaffold`, no commits yet. Follow git-flow
  (`feat/*` branches, never commit to the default branch).
