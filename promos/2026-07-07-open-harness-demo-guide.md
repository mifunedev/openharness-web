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

## Selected replacement copy

Cadence rule: publish or schedule at most one post per account per day. Keep extra angles as private drafts/options, not same-day posts.

X/Twitter rendering rule: do not leave a URL as the final visible token/line. X can suppress trailing URLs from the rendered post; keep visible text after each URL, especially the final URL.

### LinkedIn — selected replacement

🧰 **Open Harness demo → fresh sandbox to first PR**

The walkthrough is now a written setup runbook:

1. install the sandbox
2. attach VS Code
3. authenticate GitHub
4. isolate worktrees
5. open a normal PR

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide (setup runbook)

⭐ Repo: https://github.com/mifunedev/openharness — star if this setup is useful.

The useful part is not magic. It is a repeatable workspace with clear boundaries for coding agents.

#AIAgents #DeveloperTools #Docker #OpenSource

### X.com — selected replacement

🧰 Open Harness demo → fresh sandbox to first PR.

Install sandbox → attach VS Code → GitHub auth → isolated worktrees → normal PR.

Guide: https://oh.mifune.dev/blog/open-harness-demo-guide (setup runbook)
⭐ Repo: https://github.com/mifunedev/openharness — star if useful

Checks:

- X length: 271 chars.
- Final X token: `useful`, not a URL.
- Both URLs have visible non-URL text after them.

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

## Post Bridge publication

### Replacement draft

Created one replacement draft on 2026-07-08 after learning that X suppresses trailing URLs from rendered post text.

- Draft ID: `74655ecc-3aba-493d-bb87-0111a0ce42c8`
- Replacement media ID: `1e400998-adb7-4edb-aaba-ff9e02840cbd`
- Targets: X / JohnEggz (`41738`) and LinkedIn / Ruska AI (`41732`)
- Status: saved as draft only (`is_draft: true`, `scheduled_at: null`); not published or scheduled live.
- Cadence: exactly one replacement post per target account.
- X check: 271 chars; final token is `useful`, not a URL.

### Superseded publication

The prior three-variant publish set is superseded because X suppressed final URLs, leaving `Guide:` / `Star:` labels without visible URLs in the rendered tweet. The operator indicated those live posts are being deleted.

- Prior Satori media ID: `938a2e4e-163d-4f7b-a42e-ab99cab01868`
- Variant 1: `e4771829-fdb9-422f-895f-5ac660ca3fe2` — checklist/setup path angle
  - X / JohnEggz: <https://twitter.com/user/status/2074720526920978909>
  - LinkedIn / Ruska AI: <https://www.linkedin.com/feed/update/urn:li:share:7480486215687999490>
- Variant 2: `dff682c4-f7b4-4370-8ec4-05df2bce37c0` — worktree/guardrails angle
  - X / JohnEggz: <https://twitter.com/user/status/2074720521682309307>
  - LinkedIn / Ruska AI: <https://www.linkedin.com/feed/update/urn:li:share:7480486213603217408>
- Variant 3: `8e634328-a218-4565-9a1a-5b1316d2c8e7` — fresh machine/first PR angle
  - X / JohnEggz: <https://twitter.com/user/status/2074720530951770230>
  - LinkedIn / Ruska AI: <https://www.linkedin.com/feed/update/urn:li:share:7480486223669821440>

Superseded draft sets kept only for audit/history:

- Original separate drafts: `30214ff7-7b37-4b9c-878b-5e5b26df7fb9`, `8eff3f37-3d41-454f-b084-b63018324647`
- Light checklist variants: `7a4f81a9-6a37-4d46-89c1-be8c054a9747`, `c7b08db4-1714-4b95-be02-921e35d52ce0`, `d6ba458c-c665-4b8b-95b4-4fdc4c62c702`
- Hand-positioned dark SVG variants: `3fa6c77b-5cd8-4931-83da-71fecb9cbcbc`, `f5e267ca-8afb-4c18-8f0f-4a2c5c31da4d`, `269aad21-e16a-43a7-9bba-b61a3dbbfed4`

Prior status: Post Bridge originally reported `status: posted`, `is_draft: false`, `success: true`, and `error: null` for all six platform results before the X rendering issue was identified.

## Posting checklist

Before publishing the replacement draft:

- [x] PR #11 is merged and <https://oh.mifune.dev/blog/open-harness-demo-guide> returns 200.
- [x] If attaching an image, use the rerendered `social-promo-card.jpg` and the alt text above.
- [x] Confirm no screenshot exposes tokens, OAuth codes, private account details, or unwanted personal UI.
- [x] Keep LinkedIn copy as a post, not an article; link back to the blog.
- [x] Keep URLs away from the final X token/line.
- [x] Limit replacement to one post per account for the day.
- [ ] Publish only after a fresh explicit `/post-bridge` confirmation gate.
