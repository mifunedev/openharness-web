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

Use the deterministic dark promo card first; it matches the Open Harness site theme: black background, near-black terminal surface, green terminal accents, muted gray support text, and no generic AI imagery.

- Source recipe: `promos/banner-recipes/2026-07-07-open-harness-demo-guide.json`
- Render command: `pnpm run render:blog-banner -- promos/banner-recipes/2026-07-07-open-harness-demo-guide.json`
- Renderer: browserless HTML/CSS-like layout via Satori + Sharp; no Chromium/browser screenshot dependency.
- Rendered SVG output: `static/img/blog/2026-07-07-open-harness-demo-guide/social-promo-card.svg`
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

### LinkedIn — checklist/setup path

🧰 **Open Harness demo → setup checklist**

I turned the walkthrough into a practical setup path:

1. install the sandbox
2. attach VS Code
3. authenticate GitHub
4. isolate worktrees
5. open the first PR

The point is simple: give coding agents a repeatable place to work — *without using your laptop’s main checkout*.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ If this setup is useful, star the repo: https://github.com/mifunedev/openharness

#AIAgents #DeveloperTools #Docker

### LinkedIn — worktree/guardrails angle

🛠️ **The useful pattern:** make the workspace boring and repeatable.

The Open Harness guide walks through:

• Docker sandbox
• shared `.oh/` context
• GitHub auth inside the container
• isolated worktrees for PRs

That setup turns agent output into normal GitHub artifacts: issue → branch → PR.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ Star the repo if this is useful: https://github.com/mifunedev/openharness

#AIAgents #Docker #GitHub #DeveloperTools

### LinkedIn — fresh machine/first PR angle

🚀 **Fresh machine → first PR**

Open Harness is the operator loop I wanted for coding agents:

• install the sandbox
• attach VS Code
• authenticate GitHub
• isolate work in `.oh/worktrees/`
• let the agent open a normal PR

The useful part is not a new magic agent. It is a repeatable workspace with clear boundaries.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ If it helps, star the repo: https://github.com/mifunedev/openharness

#AIAgents #OpenSource #DevTools

### LinkedIn — first comment / optional Loom reference

The original Loom walkthrough is here too: https://www.loom.com/share/875737ef981f4b378a005be62d1e435b

If you try it, the setup detail I would not skip is VS Code Dev Containers attach — it makes port forwarding and browser-based auth much less painful.

## X.com drafts

### X — checklist/setup path

🧰 Open Harness demo → setup checklist

Install sandbox → attach VS Code → GitHub auth → isolated worktrees → first PR.

A repeatable place for coding agents to work.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide
⭐ Star: https://github.com/mifunedev/openharness

### X — worktree/guardrails angle

🛠️ Coding agents work better in boring, repeatable workspaces.

Open Harness pattern: Docker sandbox, shared `.oh/` context, GitHub auth, isolated worktrees.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide
⭐ Star: https://github.com/mifunedev/openharness

### X — fresh machine/first PR angle

🚀 Fresh machine → first PR, without giving agents your main checkout.

The walkthrough covers the setup checks that matter: install, attach, auth, isolate, PR.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide
⭐ Star: https://github.com/mifunedev/openharness

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

Preferred Satori dark site-theme drafts:

- Satori media ID: `938a2e4e-163d-4f7b-a42e-ab99cab01868`
- Variant 1: `e4771829-fdb9-422f-895f-5ac660ca3fe2` — checklist/setup path angle
- Variant 2: `dff682c4-f7b4-4370-8ec4-05df2bce37c0` — worktree/guardrails angle
- Variant 3: `8e634328-a218-4565-9a1a-5b1316d2c8e7` — fresh machine/first PR angle

Superseded draft sets kept only for audit/history:

- Original separate drafts: `30214ff7-7b37-4b9c-878b-5e5b26df7fb9`, `8eff3f37-3d41-454f-b084-b63018324647`
- Light checklist variants: `7a4f81a9-6a37-4d46-89c1-be8c054a9747`, `c7b08db4-1714-4b95-be02-921e35d52ce0`, `d6ba458c-c665-4b8b-95b4-4fdc4c62c702`
- Hand-positioned dark SVG variants: `3fa6c77b-5cd8-4931-83da-71fecb9cbcbc`, `f5e267ca-8afb-4c18-8f0f-4a2c5c31da4d`, `269aad21-e16a-43a7-9bba-b61a3dbbfed4`

Status: saved in Post Bridge as drafts (`is_draft: true`); not published or scheduled live.

## Posting checklist

Before posting:

- [ ] PR #11 is merged and <https://oh.mifune.dev/blog/open-harness-demo-guide> returns 200.
- [ ] Link preview renders correctly on LinkedIn and X.com.
- [ ] If attaching an image, use `social-promo-card.jpg` and the alt text above.
- [ ] Confirm no screenshot exposes tokens, OAuth codes, private account details, or unwanted personal UI.
- [ ] Keep LinkedIn copy as a post, not an article; link back to the blog.
- [ ] For X.com, choose either the single post or the thread, not both at the same time.
- [ ] Do not auto-publish from this artifact; review manually or hand off to `/post-bridge` with confirmation.
