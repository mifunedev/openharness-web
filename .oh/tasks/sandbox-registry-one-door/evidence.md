# Evidence — sandbox-registry-one-door

- **PR**: #39 (mifunedev/openharness-web, base `main`) · **Branch**: `docs/38-sandbox-registry-one-door` · **Issue**: #38
- **Audit run**: manual gates on head `167a40a` (the harness `/audit implementation` driver needs its scripts under `AUDIT_ROOT`; this clone has none, so each gate was run by hand from the harness checkout at `cd10d78e` and its output pasted below) · **Verdict**: AUDIT-PASS (gate by gate below) · **PR classification**: `promotable=true, ci=PASS, mergeable=MERGEABLE, evidenceComplete=true, isDraft=true` on head `167a40a` (CI run: Build docs site SUCCESS, Deploy skipped on pull_request)
- **Terminal state**: `DRAFT-BLOCKED(upstream-release)` by operator decision — the PR undrafts only after mifunedev/openharness#949 and #951 reach openharness `main`.

## Why this is better

**Before.** `oh.mifune.dev` taught a flow the CLI no longer implements: 47 bare `oh sandbox` lines, 31 `oh runtime`, 22 `INSTALL_*`, 17 `install.*`, 14 `oh init`, 14 persist flags, `gvisor`, `Flavor B`, "installed by default", the hero's `cd ~/.openharness && oh sandbox && oh shell`, and `OH_IMAGE_ONLY` in every raw-Docker recipe. A new reader following the homepage would run a verb that prints help and exits 1. The site's drift checker could not catch any of it (0 of those spellings were in `RETIRED`).

**After.** Every affected page is the harness copy at `cd10d78e` plus the site transform; the hero, promo, redirects, and three blog posts teach `get-oh.sh → oh sandbox install docker → oh shell <name> → oh tool install herdr / oh harness install <id>`; the checker refuses the eleven retired spelling groups and scans the hero too, so the vocabulary cannot come back by hand edit. Measured: work-list run 158 retired references → green run 0 (`PASS — 38 file(s)`).

**Cost.** ~2300 net lines of mostly copied prose (slop metrics below), one throwaway mirror script kept in the scratchpad, and two harness pages that had to be reconciled by hand because the upstream source was behind this site (divergence below). Benefit "readers stop running a deleted verb" is claimed, unmeasured (no traffic instrumentation on the site).

## What the plan asked for

Mirror-first: re-copy the affected `docs/` pages from the harness at `cd10d78e`, re-apply the site transform, reconcile site-only content; delete `deepagents.md` with redirects; mirror `runtimes/*`; extend the drift checker and prove it fires; rewrite the hero, promo, and redirects; rewrite the affected blog posts' command blocks under a dated admonition; verify the build against the branch ref and every rewritten URL; open a draft PR that stays draft until the upstream release lands on `main`; file upstream follow-ups.

## What was built

- **Docs (commit `a248940`, MDX fixup `167a40a`)** — 26 pages written by the mirror script (31 link rewrites, 6 FIXUPs matched exactly once, `deepagents.md` deleted, two pages added, positions renumbered), then hand reconciliation of `harnesses/pi.md`, `integrations/pi-fff.md`, `docker-deployment.md`, `model-selection.md`, `runtimes/microsandbox.md`, `integrations/langfuse.md`. The script's output is byte-identical to the committed tree for the 22 pages that needed no hand work.
- **Drift checker, hero, redirects, promo (commit `4a55126`)** — eleven `RETIRED` entries, `ALLOW` edits, `SCANNED` widened to `src/pages` + `.tsx`; `QUICKSTART` verbatim from the plan; DeepAgents card removed; lede, architecture, footer sentences replaced; both deepagents redirects to the overview; promo recipe edited and the banner re-rendered.
- **Blog (commit `b7a7c41`)** — dated admonitions and rewritten command blocks in the three affected posts; the archived BYOH post annotated; `OH_IMAGE_ONLY` gone from every `docker run` and compose environment.
- **Upstream follow-ups filed** — https://github.com/mifunedev/openharness/issues/950#issuecomment-5520094689

### Actual Knowledge Impact
`Expected Knowledge Impact` was NOT-APPLICABLE and the diff confirms it: every changed path is in `mifunedev/openharness-web`; no `.oh/knowledge/` page declares a source in this repository, and no harness source moved. `knowledge-impact.sh --changed` was not run (its input is harness paths; there are none). Two retro-supported patterns were drafted to the harness's `.oh/knowledge/local/` for promotion in the next harness PR (`/wiki ingest .oh/knowledge/local/<slug>.md --slug <slug>`): `pattern-docs-mirror-source-behind-target`, `pattern-delegate-shared-tree-restore-by-checkout`.

## Where it diverged from the plan, and why

- **Two mirrored pages reconciled beyond "verbatim + transform".** `docs/runtimes/microsandbox.md` at `cd10d78e` still carries the pre-#899 five-directory msb bind set and `OH_PROJECT_ROOT`; `docs/integrations/langfuse.md` still names the `pi-auth` volume. The site's own checker fired on those four lines after the mirror. The single-home-mount Step 2, table row, `sandbox.yaml`, and reset command were ported from the site's #36 version onto the harness copy; three langfuse sentences reworded. Filed upstream. The plan's operator decision "mirror `runtimes/*`" is honoured for the #951 vocabulary; the mount model follows the source of truth (compose at `cd10d78e` has one `/home/sandbox` mount).
- **Two extra transform rules.** GitHub autolinks `<https://…>` and single-line `<details><summary>` fail MDX; the first build failed on three lines. The script and the tree now rewrite both.
- **`SITE_ONLY` widened** to include `property-testing.md` and `integrations/pi-dynamic-workflows.md` (the plan listed three site-only pages; the harness links `../integrations/pi-dynamic-workflows.md`, which exists on the site and must stay relative).
- **Blog executor corrected four unenumerated sentences** in the same error class as the named ones (post 1 frontmatter description; post 2 "fifth auth volume", "auth mounts", "shared GitHub/SSH auth"; post 3 the DeepAgents wizard paragraph and a `projects/` line in the tree). Each was checked against `cd10d78e`.
- **The `langfuse.baseUrl` projection sentence** (`langfuse.md:248-251`) follows the harness ("the harness does not project them into the container") rather than the site's older wording; verified: no `LANGFUSE` key in `.devcontainer/docker-compose*.yml` or `.oh/scripts/docker-compose.sh` at `cd10d78e`.
- **Audit tooling run by hand.** The `/audit implementation` and `/audit pr` drivers assume harness scripts under `AUDIT_ROOT`; gate 1, gate 5, and the PR classifier were invoked directly from the harness checkout and their outputs are pasted below. `/eval` (harness probe suite) does not apply to this repository; the site's `check:docs-drift`, `typecheck`, and `build` stand in.
- **`docs` branch prefix** follows this repo's convention (`docs/35-single-home-mount`), not the harness `/ralph` prefix list.

## What remains unverified

- **The undraft itself.** By design this run ends at `DRAFT-BLOCKED(upstream-release)`; the promotable classification below describes head `167a40a`, and the undraft procedure in the PR body must be re-run after the rebase on the released `main`.
- **The CI build uses `OH_SCRIPTS_REF=main`** (the workflow default on `pull_request`), so CI proves the docs compile but not that the mirrored `oh.js` has the new verbs; the local build against `task/950-sandbox-registry` proves the latter (`node static/oh.js sandbox --help | grep -c install` → 2).
- **Browser check** for the hero was a `docusaurus serve` + `curl` spot-check, not agent-browser: routes return 200, the hero HTML contains `oh sandbox install docker`, both deepagents paths carry the client redirect.
- **The archived BYOH post** still says "preinstalled" in its narrative (deliberately, under the extended Archived note); `blog/` is not scanned by the checker per the site's policy.
- **`.pi/APPEND_SYSTEM.md` link** in `integrations/pi-fff.md` is an upstream absolute URL pinned to `blob/development` (unchanged from the harness source; rule 1 leaves absolute URLs alone).
- **Simplify residual**: one round recorded; the diff is copied documentation, no reducing candidate identified.

## Proof by gate

| Gate | What was checked | Observed | Result |
|------|------------------|----------|--------|
| Task graph | `implementation-gates.sh gate1 sandbox-registry-one-door` (AUDIT_ROOT = this clone) | `task-graph: 7/7 stories pass`, rc=0 (six required artifacts present) | PASS |
| Regression floor | site checks in place of `/eval` | `check:docs-drift` PASS (38 files); `typecheck` rc=0; `build` rc=0, no broken links | PASS |
| Promotable / CI | `pr-acquire.sh pr --repo mifunedev/openharness-web --pr 39 --base main \| pr-classify.sh` | `promotable=true, ci=PASS, mergeable=MERGEABLE, evidenceComplete=true, isDraft=true` on head `167a40a` (CI run: Build docs site SUCCESS, Deploy skipped on pull_request) | see row |
| UI | US-004 browser criterion | `docusaurus serve` spot-check (below) | PASS (spot-check) |
| Slop | `implementation-gates.sh slop-metrics origin/main` | `+2301/-1014`, `shBranchPoints 0`, `tsOverCcn []` | PASS |

## Observed output

```text
$ node scripts/check-docs-drift.mjs        # work-list run, checker extended, pages untouched
[docs-drift] 158 retired reference(s) in docs/, promos/, src/pages/:
$ pnpm run check:docs-drift                 # green run
[docs-drift] PASS — 38 file(s) under docs/, promos/, src/pages/, no retired references
rc=0
$ pnpm run typecheck
> tsc --noEmit
typecheck rc=0

$ OH_SCRIPTS_REF=task/950-sandbox-registry pnpm run build   # second build, after 167a40a
[build-oh-cli] wrote static/oh.js <- mifunedev/openharness@task/950-sandbox-registry (cd10d78e8f6063eb6b7340aff459834ba5dc45de, .oh/cli)
[webpackbar] ✔ Server: Compiled successfully in 5.28s
[webpackbar] ✔ Client: Compiled successfully in 1.76m
[SUCCESS] Generated static files in "build".
[theme-order] PASS — 4 page(s): ...
build rc=0
(first build, before 167a40a: "MDX compilation failed" for docs/integrations/langfuse.md:153,
 docs/runtimes/docker.md:30, docs/quickstart.md:85 — build rc=1; same three errors on CI run 33713273000)

$ negative test (drift-negative-test.txt)
### STEP 1: append `Run `oh init` then `oh sandbox`.` to docs/resources.md
exit=1
  docs/resources.md:13 — oh init: "oh init"
  docs/resources.md:13 — bare `oh sandbox`: "oh sandbox"
### STEP 2: replace with the three allowed forms
(no resources.md violations)

$ residual grep over docs promos src blog docusaurus.config.ts
## retired terms   -> 9 blog admonition lines, blog/archive/2026-04-28-byoh.md:12,32 (Archived note + archived prose),
                      blog/2026-07-11-...:203 ("INSTALL_HERMES ... is gone too"), docusaurus.config.ts:91,96,97 (redirect from: paths)
## bare oh sandbox -> docs/lifecycle-commands.md:75, docs/runtimes/overview.md:10 (both ALLOWed)

$ curl loop (curl-links.txt): 11 URLs, all "200 200" on main and task/950-sandbox-registry

$ docusaurus serve --port 3111 (serve-spotcheck.txt)
200 /                                    
200 /docs                                
200 /docs/deployment-prebuilt-image      
200 /docs/harnesses/deepagents           redirect->/docs/harnesses/overview
200 /docs/oh-directory-layout            
200 /docs/agents/deepagents              redirect->/docs/harnesses/overview
200 /docs/harnesses/overview             
hero contains 'oh sandbox install docker': 1
static/oh.js 'sandbox install' occurrences: 12
node static/oh.js sandbox --help | grep -c install: 2

$ D1 mirror diff (d1-mirror-diff.txt): 26 pages; body diffs vs harness = link rewrites (31) + FIXUPs (6)
  + hand reconcile on pi.md, pi-fff.md, microsandbox.md, langfuse.md; script output byte-identical
  to the committed tree for the other 22 pages.

$ AUDIT_ROOT=$PWD implementation-gates.sh slop-metrics origin/main
{"netAdded":2301,"netRemoved":1014,"shBranchPoints":0,"ccnMax":10,"tsOverCcn":[],"tool":"lizard 1.24.0"}
```

## Acceptance criteria → proof

| Story | Criterion | Proof |
|-------|-----------|-------|
| US-001 | mirror script, 26 pages, FIXUPs once each, positions, commit | commit `a248940` body (rewrite log); `d1-mirror-diff.txt` |
| US-002 | pi/pi-fff/intro/resources/connecting reconcile; docker-deployment edits; positions; unchanged files | `docs/harnesses/pi.md:35` "## Choose a model", `:57` autoresearch bullet; `docs/docker-deployment.md` diff; `git diff --stat main` shows no change to `property-testing.md`, `pi-autoresearch.md`, `pi-dynamic-workflows.md` |
| US-003 | eleven RETIRED, ALLOW edits, SCANNED, negative test, work-list/green, typecheck | `scripts/check-docs-drift.mjs` diff; `drift-worklist.txt` (158); `drift-negative-test.txt`; PASS above |
| US-004 | QUICKSTART verbatim, card/lede/architecture/footer, redirects, promo, typecheck, browser | `src/pages/index.tsx` diff; `docusaurus.config.ts:96-97`; recipe diff + re-rendered banner; serve spot-check |
| US-005 | admonitions, OH_IMAGE_ONLY gone, demo/BYOH rewrites, residual grep | commit `b7a7c41`; residual grep above |
| US-006 | install, checker, typecheck, build, residual grep, curl loop, serve | observed output above |
| US-007 | issue, draft PR, evidence committed, follow-ups filed, DRAFT-BLOCKED | #38, #39, this file, #950 comment URL above, `/tmp/spec-sandbox-registry-one-door.state` |

## Gaps and non-gating findings

- Harness driver not used (see divergence); every gate's command and output is above.
- `/eval` not applicable to this repository; no `eval-result.json` is written.
- The first CI run on `4a55126` failed on the three MDX lines; fixed in `167a40a`.
