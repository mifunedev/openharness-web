# Promotion Artifact — Open Harness Demo Guide

## Source

- Blog post source: `blog/2026-07-07-open-harness-demo-guide.md`
- Blog URL after merge: <https://oh.mifune.dev/blog/open-harness-demo-guide>
- PR: <https://github.com/mifunedev/openharness-web/pull/11>
- Loom source: <https://www.loom.com/share/875737ef981f4b378a005be62d1e435b>

## Target profiles

- LinkedIn: <https://www.linkedin.com/in/ryan-eggleston>
- X.com: <https://x.com/JohnEggz>

## Suggested asset

Use the deterministic promo card first; it pulls the blog's headline, proof path, and setup screenshot into a feed-native image.

- Source recipe: `promos/banner-recipes/2026-07-07-open-harness-demo-guide.json`
- Render command: `pnpm run render:blog-banner -- promos/banner-recipes/2026-07-07-open-harness-demo-guide.json`
- Editable SVG output: `static/img/blog/2026-07-07-open-harness-demo-guide/social-promo-card.svg`
- Preferred local asset: `static/img/blog/2026-07-07-open-harness-demo-guide/social-promo-card.jpg`
- Preferred public asset after merge: <https://oh.mifune.dev/img/blog/2026-07-07-open-harness-demo-guide/social-promo-card.jpg>
- Fallback local screenshot: `static/img/blog/2026-07-07-open-harness-demo-guide/install-prereqs.jpg`
- Fallback public screenshot after merge: <https://oh.mifune.dev/img/blog/2026-07-07-open-harness-demo-guide/install-prereqs.jpg>
- Alt text: "Social card for the Open Harness demo guide: A repeatable sandbox for coding agents, with install, attach, authenticate, isolate worktrees, and open first PR steps."

## Positioning

Core message: Open Harness turns a fresh machine into an isolated, repeatable AI development sandbox that can go from install to first GitHub PR without agents touching your laptop directly.

Audience:

- AI engineers experimenting with coding agents
- developers who want remote/isolated agent workspaces
- operators comparing Claude Code, Codex, Pi, and other harnesses
- teams that need repeatable setup docs instead of one-off local machines

## LinkedIn drafts

### LinkedIn — main post

I turned my Open Harness walkthrough into a written guide: from a fresh machine to the first agent-created PR.

The flow is simple:

1. install the Docker sandbox
2. keep the safe defaults, including Docker socket off by default
3. attach with VS Code Dev Containers
4. verify Claude Code / Codex / Pi can see the same `.oh/` workspace
5. connect GitHub CLI inside the sandbox
6. use `.oh/worktrees/` so agent tasks stay isolated
7. let the agent create the first issue/PR

The point is not “which agent wins?” It is giving agents a repeatable place to work that is not your laptop’s main checkout.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide

#AIAgents #DeveloperTools #Docker #OpenSource #GitHub

### LinkedIn — shorter version

New Open Harness guide: fresh sandbox → VS Code attach → GitHub auth → isolated worktrees → first agent-created PR.

If you are testing Claude Code, Codex, Pi, or other coding agents, the useful pattern is putting them in a repeatable Docker sandbox with shared context and isolated task workspaces.

I’d value feedback from agent builders and operators: what setup steps, safety defaults, or workflow guardrails would make this more useful?

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide

#AIAgents #Docker #DeveloperTools

### LinkedIn — first comment / CTA

The original Loom walkthrough is here too: https://www.loom.com/share/875737ef981f4b378a005be62d1e435b

If you try it, the setup detail I would not skip is VS Code Dev Containers attach — it makes port forwarding and browser-based auth much less painful.

## X.com drafts

### X — single post

I wrote up the Open Harness demo: fresh machine → Docker sandbox → VS Code attach → GitHub auth → isolated `.oh/worktrees/` → first PR.

If you run coding agents, I’d value feedback on the setup path and guardrails.

https://oh.mifune.dev/blog/open-harness-demo-guide

### X — thread

1/ I turned the Open Harness walkthrough into a written guide.

Goal: start with a fresh machine and end with an agent opening its first GitHub PR from inside an isolated Docker sandbox.

https://oh.mifune.dev/blog/open-harness-demo-guide

2/ The important setup choices:

- Docker + Git + make on the host
- agent CLIs inside the sandbox
- Docker socket off by default
- VS Code Dev Containers attach for the full workstation flow

3/ The useful mental model is `.oh/` as the shared control plane:

- context
- skills
- memory
- scripts
- worktrees

Claude Code, Codex, Pi, etc. can all work against the same repo state.

4/ The payoff is `.oh/worktrees/`.

Agent tasks should not all mutate your main checkout. Worktrees/project clones give each task a safe place to branch, scaffold, and open a normal PR.

5/ If you are experimenting with coding agents, start by fixing the environment.

A repeatable sandbox beats another one-off local setup.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide

### X — quote-post variant

Fresh sandbox to first PR.

Install once, attach cleanly, authenticate inside the sandbox, isolate work in `.oh/worktrees/`, and let agents create normal GitHub artifacts.

https://oh.mifune.dev/blog/open-harness-demo-guide

## Hashtags / keywords

Use sparingly; prefer 2-4 per platform.

- #AIAgents
- #DeveloperTools
- #Docker
- #OpenSource
- #GitHub
- #DevTools
- coding agents
- agentic development
- remote development
- VS Code Dev Containers

## Post Bridge drafts

- X / JohnEggz draft: `30214ff7-7b37-4b9c-878b-5e5b26df7fb9`
- LinkedIn page draft: `8eff3f37-3d41-454f-b084-b63018324647`
- Original X / JohnEggz draft: `30214ff7-7b37-4b9c-878b-5e5b26df7fb9`
- Original LinkedIn page draft: `8eff3f37-3d41-454f-b084-b63018324647`
- Original attached media ID: `a4d2ec71-5853-4fa9-8e58-a1e84ee4fcff`
- New draft set media ID: `79aa8dea-c4bd-49ad-938a-ff71a5886155`
- New cross-platform variant 1: `7a4f81a9-6a37-4d46-89c1-be8c054a9747` — checklist/setup path angle
- New cross-platform variant 2: `c7b08db4-1714-4b95-be02-921e35d52ce0` — worktree/guardrails angle
- New cross-platform variant 3: `d6ba458c-c665-4b8b-95b4-4fdc4c62c702` — fresh machine/first PR angle
- Status: saved in Post Bridge as drafts (`is_draft: true`); not published or scheduled live.

## Posting checklist

Before posting:

- [ ] PR #11 is merged and <https://oh.mifune.dev/blog/open-harness-demo-guide> returns 200.
- [ ] Link preview renders correctly on LinkedIn and X.com.
- [ ] If attaching an image, use `social-promo-card.jpg` and the alt text above.
- [ ] Confirm no screenshot exposes tokens, OAuth codes, private account details, or unwanted personal UI.
- [ ] Keep LinkedIn copy as a post, not an article; link back to the blog.
- [ ] For X.com, choose either the single post or the thread, not both at the same time.
- [ ] Do not auto-publish from this artifact; review manually or hand off to `/post-bridge` with confirmation.
