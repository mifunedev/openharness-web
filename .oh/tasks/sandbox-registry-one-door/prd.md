# PRD: Mirror #948 (one door) and #950 (sandbox registry) into openharness-web

**Target repo:** `mifunedev/openharness-web` (Docusaurus 3.10, GitHub Pages, `oh.mifune.dev`) · **Base:** `main` @ `78d6ad1e`
**Upstream:** `mifunedev/openharness` issues #948 / #950, PRs #949 / #951; docs source head `task/950-sandbox-registry` @ `cd10d78e`
**Approved plan:** `plan.md` in this folder (copied from `.claude/plans/happy-watching-sloth.md`). The plan is the authority for every literal below; this PRD orders it into stories.

## Introduction

The public docs site is a hand-copied duplicate of the harness `docs/` with no prose sync. Two upstream changes moved the operator flow: nothing installs at boot and `oh harness install <id>` / `oh tool install <id>` are the only door (#948); `oh init` and `oh runtime` are deleted, `oh sandbox install docker` creates a sandbox from any directory into a registry at `${OH_HOME:-~/.oh}/sandboxes/<name>/`, lifecycle verbs take `[name]`, and `oh update` bootstraps a checkout (#950). The site still teaches the old flow (47 bare `oh sandbox` lines, 31 `oh runtime`, 22 `INSTALL_*`, 17 `install.*`, 14 `oh init`, 14 persist flags, `gvisor`, `Flavor B`, "installed by default", and the hero's `cd ~/.openharness && oh sandbox && oh shell`). Re-copy the affected pages from the harness at `cd10d78e`, re-apply the site transform, reconcile site-only content, extend the drift checker so the vocabulary cannot return, rewrite the hero and the affected blog posts, and open a draft PR that stays draft until #949/#951 reach openharness `main` (the served `oh.js`, `get-oh.sh`, and `install.sh` all come from `main`).

## Goals

- Every affected `docs/` page equals the harness copy at `cd10d78e` plus the site transform (frontmatter merge, link rules, listed FIXUPS); `deepagents.md` deleted with redirects; `deployment-prebuilt-image.md` (title "Creating a sandbox") and `oh-directory-layout.md` added.
- `scripts/check-docs-drift.mjs` retires the eleven vocabulary groups the plan lists, scans `src/pages` (`.tsx`) as well, and a negative test proves it fires.
- Hero `QUICKSTART`, lede, DeepAgents card, architecture sentence, promo recipe, and client redirects reflect the new flow; `pnpm run typecheck` is clean.
- The three affected blog posts carry rewritten command blocks under a dated admonition; the archived BYOH post is annotated; `OH_IMAGE_ONLY` leaves every `docker run` recipe.
- `OH_SCRIPTS_REF=task/950-sandbox-registry pnpm run build` succeeds with zero broken-link warnings and every rewritten `blob/main/...` URL returns 200 on `main` and on the branch.
- A draft PR on `mifunedev/openharness-web` with the disposition table, checker diff, verification output, "why draft", and the undraft procedure; follow-ups filed upstream.

## User Stories

### US-001: Mirror the affected docs pages from the harness at cd10d78e

**Description:** As a reader of oh.mifune.dev, I want every mirrored page to match the harness docs so that the site teaches the flow the CLI actually implements.

**Acceptance Criteria:**

- [ ] A throwaway `mirror-docs.mjs` (scratchpad, not committed) implements the plan's PAGES map, FIXUPS map (each must match exactly once, else throw), frontmatter merge order `id, slug, sidebar_position, title`, and the five link rules with `GH=https://github.com/mifunedev/openharness/blob/main`
- [ ] MIRROR pages written: `installation`, `quickstart`, `lifecycle-commands`, `configuration` (title "Configuration"), `harnesses/{overview,claude-code,codex,opencode,t3code,grok-build}`, `integrations/{slack,github,debugmcp,langfuse}`, `runtimes/{overview,docker,microsandbox}`
- [ ] MIRROR+RECONCILE pages written with their preserved frontmatter: `intro` (`slug: /`), `connecting` (`id`/`slug: /connecting`), `harnesses/pi`, `integrations/pi-fff`, `resources`
- [ ] MIRROR+FIXUP applied: `contributing.md` bare `oh sandbox` line → `oh sandbox install docker` + `oh sandbox list` lines; `harnesses/hermes.md` `oh stop && oh sandbox` → `oh stop <name> && oh sandbox install docker --name <name>`; `deployment-prebuilt-image.md` git identity → placeholders
- [ ] ADD: `docs/deployment-prebuilt-image.md` (`title: "Creating a sandbox"`, position 4) and `docs/oh-directory-layout.md` (`title: ".oh/ directory layout"`, position 11)
- [ ] DELETE: `docs/harnesses/deepagents.md`
- [ ] Top-level `sidebar_position` per the plan: intro 1, installation 2, quickstart 3, deployment-prebuilt-image 4, connecting 5, lifecycle-commands 6, configuration 7, docker-deployment 8, harnesses 9, runtimes 10, oh-directory-layout 11, model-selection 12, integrations 13, resources 14, contributing 999
- [ ] `diff` of each mirrored page against its harness source shows only frontmatter, link rewrites, and the listed FIXUPS (the rewrite log `page:line old -> new` is kept in the commit body)
- [ ] Commit `docs: mirror docs/ from openharness cd10d78e (#948, #950)` on the branch

### US-002: Reconcile site-only content

**Description:** As a reader, I want the site-only pages and carried-over sections to keep working after the mirror so that no link or recipe on the site points at something that no longer exists.

**Acceptance Criteria:**

- [ ] `harnesses/pi.md` carries the site's "## Choose a model" section, the `pi-autoresearch` bullet, and the `pi -e npm:pi-autoresearch@1.6.0` mention on top of the harness copy
- [ ] `integrations/pi-fff.md` keeps the `pi-autoresearch` mention; `intro.md` links `/blog/compound-engineering`; `resources.md` keeps the `/blog/compound-engineering` bullet; `connecting.md` points `/docs/integrations/sshd` at the GitHub URL
- [ ] `docker-deployment.md`: second paragraph points at `/docs/deployment-prebuilt-image` as the default CLI path; both `-e OH_IMAGE_ONLY=1 \` lines deleted; the seeding sentence says the entrypoint seeds `/opt/oh-seed` when no checkout is bound at `/home/sandbox/harness`; "### Install the tools first" (`oh tool install herdr && herdr`, `oh harness install claude-code`, `oh harness install pi`) precedes "### GitHub and SSH"; the two upstream links fixed (`/docs/deployment-prebuilt-image`, `blob/main/.devcontainer/docker-compose.image-only.yml`); `sidebar_position: 8`
- [ ] `model-selection.md` position 12; `resources.md` position 14
- [ ] `property-testing.md`, `integrations/pi-dynamic-workflows.md`, `integrations/pi-autoresearch.md` unchanged

### US-003: Extend the drift checker and prove it fires

**Description:** As a maintainer, I want `check:docs-drift` to fail on every retired spelling so that the vocabulary cannot come back through a later hand edit.

**Acceptance Criteria:**

- [ ] The eleven `RETIRED` entries from the plan are appended verbatim (oh init, oh runtime, bare `oh sandbox`, persist flags, install.* key, INSTALL_* flag, HERMES_DASHBOARD env, gvisor, Flavor A/B, "preinstalled", /home/sandbox/project)
- [ ] `ALLOW`: the `projectRoot / OH_PROJECT_ROOT` entry removed; `lifecycle-commands.md` / bare `oh sandbox` and `runtimes/overview.md` / bare `oh sandbox` entries added with the plan's reasons; layout-knob, `harness.yaml`, and per-tool-volume entries kept
- [ ] `SCANNED = ["docs", "promos", "src/pages"]`; `SCANNED_EXTENSIONS` includes `.tsx`
- [ ] Negative test transcript: appending `` Run `oh init` then `oh sandbox`. `` to `docs/resources.md` makes the checker exit 1 naming the file, line, and both tokens; appending `` `oh sandbox install docker`, `oh sandbox list`, `oh sandbox --help` `` exits 0; the file is restored with `git checkout`
- [ ] The work-list run (checker extended, pages not yet fixed) is captured; the green run prints `PASS`
- [ ] Typecheck passes

### US-004: Rewrite the hero, promo recipe, and redirects

**Description:** As a first-time visitor, I want the homepage to show the real four-step flow so that the most-read code block on the site is not wrong.

**Acceptance Criteria:**

- [ ] `src/pages/index.tsx` `QUICKSTART` equals the plan's block verbatim
- [ ] The DeepAgents `AGENTS` card is removed; the lede reads "Nothing installs at boot. Add Claude Code, Codex, Pi, OpenCode, Hermes, or Grok Build with one `oh harness install <id>` inside the sandbox; T3 Code runs on demand…"; the architecture card sentence describes the registry entry `~/.oh/sandboxes/<name>/oh.json` (wizard-written, `oh config set --sandbox <name>`, opt-in overlays, `composeOverrides[]`); the terminal footer link text is "Raw Docker, no CLI →" with its target unchanged
- [ ] `docusaurus.config.ts`: `/docs/agents/deepagents` → `/docs/harnesses/overview`; `/docs/harnesses/deepagents` → `/docs/harnesses/overview` added
- [ ] `promos/banner-recipes/2026-07-07-open-harness-demo-guide.json`: `terminalLines[1].text` → `oh sandbox install docker && oh shell`, `terminalLines[3].text` → `oh harness install claude-code && claude`, `.oh/worktrees/` → `.worktrees/`; banner re-rendered with `pnpm run render:blog-banner -- <recipe>` when `sharp` works, else the recipe alone is committed and the PR says so
- [ ] `pnpm run typecheck` passes
- [ ] Verify in browser using agent-browser skill (or `pnpm run serve` spot-check when agent-browser is unavailable, recorded as such)

### US-005: Rewrite the affected blog posts under dated admonitions

**Description:** As a reader of a dated post, I want the commands to work today and a note explaining what changed so that copy-pasting a recipe does not run a deleted verb.

**Acceptance Criteria:**

- [ ] Shared admonition (dated 2026-09-02, citing #948 and #950) added or replaced in `2026-07-06-first-sandbox-agent-auth.md`, `2026-07-11-deploy-open-harness-with-docker.md`, `2026-07-07-open-harness-demo-guide.md` per the plan's per-post list
- [ ] `-e OH_IMAGE_ONLY=1` removed from every `docker run` block and the compose `environment:` in the two deployment posts; install-first blocks inserted; `install.*` / persist-flag paragraphs replaced with one-door text
- [ ] Demo post: prerequisites Node ≥ 20; install block → `get-oh.sh` + `oh sandbox install docker`; clone-and-own → `oh sandbox install docker --repo "$PWD" --name openharness`; bullets → `~/.oh/sandboxes/oh-sbx-1/oh.json`, `oh secret set --sandbox`, `oh shell oh-sbx-1`, `oh destroy oh-sbx-1`; `make shell` ×3 → `oh shell oh-sbx-1`; `.oh/` list per `oh-directory-layout.md`; `.oh/worktrees/` → `.worktrees/`
- [ ] `archive/2026-04-28-byoh.md` "Archived" note extended; commands → `oh sandbox install docker --name my-agent`, `oh shell my-agent`, `oh destroy my-agent`
- [ ] `2026-06-07-containers-microvms-vms.md` unchanged
- [ ] Residual grep over `blog/` for `OH_IMAGE_ONLY`, `oh init`, `oh runtime`, persist flags, `install.*`, `make shell` finds only admonition text

### US-006: Verify the whole branch

**Description:** As the reviewer, I want the build, link, and residual checks run on the merged branch so that the PR's claims are observed, not predicted.

**Acceptance Criteria:**

- [ ] `pnpm install --frozen-lockfile` succeeds
- [ ] `pnpm run check:docs-drift` prints `PASS`
- [ ] `pnpm run typecheck` exits 0
- [ ] `OH_SCRIPTS_REF=task/950-sandbox-registry pnpm run build` exits 0 and its log has no `broken` hit
- [ ] Residual grep over `docs promos src blog docusaurus.config.ts` for every retired term finds only the blog admonitions and the two `deepagents` redirect `from:` paths; the bare-`oh sandbox` PCRE finds only `lifecycle-commands.md:74` and `runtimes/overview.md:9`
- [ ] Every `blob/main/...` URL in `docs/` returns `200 200` on `main` and on `task/950-sandbox-registry`
- [ ] `pnpm run serve` spot-check of `/`, `/docs`, `/docs/deployment-prebuilt-image`, `/docs/harnesses/deepagents` (redirect) recorded

### US-007: Deliver the draft PR, evidence, and follow-ups

**Description:** As the operator, I want a draft PR whose body carries the disposition, the checker diff, the verification output, and the undraft procedure so that merging after the upstream release is a two-command act.

**Acceptance Criteria:**

- [ ] Issue on `mifunedev/openharness-web` titled `docs: mirror the sandbox registry and one-door changes (#948, #950)`; branch `docs/<N>-sandbox-registry-one-door` off `main`
- [ ] PR `FROM docs/<N>-sandbox-registry-one-door TO main`, draft, body sections: Summary, Upstream, Disposition, Drift checker (+ negative test), Hero/promo, Blog, Verification, Why draft, Follow-ups, Undraft procedure
- [ ] `.oh/tasks/sandbox-registry-one-door/evidence.md` written per the reviewer evidence contract and committed on the branch
- [ ] Follow-ups filed as a comment on `mifunedev/openharness#950` (bare `oh sandbox` residuals, CLI hints, `oh sandbox install --help`, #617 caveat, git identity in the recipe) with the resolvable URL recorded in `evidence.md`
- [ ] The PR stays draft; terminal state reported as `DRAFT-BLOCKED(upstream-release)` with the PR URL

## Functional Requirements

- FR-1: Mirrored pages differ from their harness source only by frontmatter, link rewrites, and the listed FIXUPS.
- FR-2: Link rule: `http(s)://`, `mailto:`, and bare anchors unchanged; `/docs/<x>` kept only when `docs/<x>.md` will exist on the site, else `${GH}/docs/<x>.md`; relative `.md` targets resolved to a repo-relative path and kept only when they resolve to a site page, else `${GH}/<path>`; any other relative target → `${GH}/<path>`; "will exist" = PAGES ∪ SITE_ONLY − DELETE.
- FR-3: The drift checker's `RETIRED` gains exactly the eleven entries in the plan; the devcontainer dotenv literal is not retired.
- FR-4: The checker scans `docs`, `promos`, and `src/pages` with extensions `.md`, `.json`, `.tsx`.
- FR-5: Blog posts keep their dates and screenshots; changes are command blocks and the admonition.
- FR-6: The PR is created draft and is not marked ready in this run.

## Non-Goals

- Mirroring `security-considerations`, `integrations/{sshd,herdr}`, `glossary`, `rfcs/*`, `harness-manifest`, `repair-operator-registry` — they stay absolute links.
- Any change to the harness repository (upstream residuals are filed, not fixed).
- Scanning `blog/` in the drift checker.
- Undrafting or merging the PR before #949/#951 reach openharness `main`.
- Committing the mirror script to `scripts/` (named as a follow-up candidate).

## Technical Considerations

- The clone at `projects/mifunedev/openharness-web` is the only working tree; no worktrees. Executors edit disjoint files and never commit; the owner commits per wave.
- `pnpm run build` reaches GitHub for `get-oh.sh` and `oh.js`; `OH_SCRIPTS_REF` selects the ref. A token in the environment is honoured and never echoed.
- `sharp` may not load in the sandbox; the banner re-render is best-effort.
- The `/spec` audit tooling lives in the harness checkout; gates that need `AUDIT_ROOT` scripts are run by hand against this clone and their output recorded verbatim.

## Success Metrics

- Retired-token hits under `docs/`, `promos/`, `src/pages/`: 0 (checker PASS).
- Broken-link warnings in the Docusaurus build: 0.
- Drifted pages versus the harness at `cd10d78e`: 0 among the mirrored set.

## Open Questions

- None blocking. Whether to promote `mirror-docs.mjs` into `scripts/` is deferred to a second mirror PR.

## Knowledge Context

- **Base commit**: `78d6ad1e` (openharness-web `main`); harness docs source `cd10d78e` (`task/950-sandbox-registry`)
- **Queries**: `docs site mirror cli sandbox registry`, `docs guards vocabulary --patterns`
- **Knowledge used**: `[[oh-cli-portable-lifecycle]]`, `[[fresh-machine-setup]]`, `[[compose-env-boundary]]`; patterns `[[pattern-docs-prohibition-by-example]]`, `[[pattern-evals-prose-literal-pinning]]`
- **Grounded against**: `scripts/check-docs-drift.mjs`, `src/pages/index.tsx`, `docusaurus.config.ts`, `README.md`, `docs/**`, `blog/**`, `promos/banner-recipes/2026-07-07-open-harness-demo-guide.json`, `.github/workflows/pages.yml`, `scripts/oh-source.mjs` (all openharness-web `78d6ad1e`); `docs/**`, `.oh/cli/src/commands/{harness,tool,sandbox}.ts`, `.oh/cli/src/cli.ts`, `.oh/cli/src/lib/lifecycle.ts`, `.oh/cli/src/lib/local-target.ts` (openharness `cd10d78e`)
- **Conflicts discovered**: an Explore agent reported `oh sandbox --help` lacks a `Runtimes:` block; re-grounding against the built CLI at `cd10d78e` showed the block exists (the agent's 25-line output cap truncated it). Knowledge pages agreed with the sources.

## Expected Knowledge Impact

- **Impact**: NOT-APPLICABLE
- **Expected entries**: none
- **Affected source paths**: `mifunedev/openharness-web` only (`docs/**`, `blog/**`, `src/pages/index.tsx`, `scripts/check-docs-drift.mjs`, `docusaurus.config.ts`, `promos/**`)
- **Reason**: no `.oh/knowledge/` page declares a source inside the web repository; the harness sources the pages cite do not change in this task. Any pattern the retro supports is recorded in `evidence.md` and compiled in the next harness PR rather than pushed onto the READY #951 head.

## Plan Reconciliation

- **Source plan**: `.claude/plans/happy-watching-sloth.md` (copied to `plan.md` in this folder)
- **Intent preserved**: YES
- **Material deviations**: none
- **Constraints discovered during grounding**: the `/spec` task folder lives in the web repository at `.oh/tasks/sandbox-registry-one-door/` so `evidence.md` travels in the PR diff; the `/audit` driver's `classify-pr` and `/eval` gates assume harness scripts under `AUDIT_ROOT`, so they are run by hand and the site's own checks (`check:docs-drift`, `typecheck`, `build`) stand in for the probe suite; the `docs` branch prefix follows the web repo's convention (`docs/35-single-home-mount`) rather than the harness `/ralph` prefix list.
