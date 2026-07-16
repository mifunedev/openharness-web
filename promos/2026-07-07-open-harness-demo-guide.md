# Promotion Artifact — Open Harness Demo Guide

## Source

- Blog post source: `blog/2026-07-07-open-harness-demo-guide.md`
- Blog URL after merge: <https://oh.mifune.dev/blog/open-harness-demo-guide>
- PR: <https://github.com/mifunedev/openharness-web/pull/11>
- Loom source: <https://www.loom.com/share/875737ef981f4b378a005be62d1e435b>

## Target profiles and channels

- LinkedIn: <https://www.linkedin.com/in/ryan-eggleston>
- X.com: <https://x.com/JohnEggz>
- Slack: internal/community announcement channel; paste manually and allow link unfurl.
- Discord: community updates/devtools channel; paste manually and allow link embed.
- Telegram: broadcast/community channel; paste manually and allow link preview.

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

🧰 𝗢𝗽𝗲𝗻 𝗛𝗮𝗿𝗻𝗲𝘀𝘀 𝗱𝗲𝗺𝗼 → fresh sandbox to first PR

The walkthrough is now a written setup runbook:

1. install sandbox
2. attach VS Code
3. authenticate GitHub
4. isolate worktrees
5. open a normal PR

https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ Star the repo if the setup is useful — the guide links through to GitHub.

#AIAgents #DeveloperTools #Docker #OpenSource

### X.com — selected replacement

🧰 Open Harness demo → fresh sandbox to first PR.

Install sandbox → attach VS Code → GitHub auth → isolated worktrees → normal PR.

https://oh.mifune.dev/blog/open-harness-demo-guide

Checks:

- X length: 182 chars.
- Direct blog URL is the only link.
- No uploaded media attached; the platform should render a clickable link card from the page metadata.

## Channel blasts

Use the direct blog URL as the only link so Slack, Discord, and Telegram can render the blog card/banner from Open Graph metadata. Do not attach the promo image separately unless a channel preview fails.

### Slack

```text
🧰 New Open Harness demo guide: fresh sandbox → first PR

A written walkthrough for setting up an isolated coding-agent workspace:
• install the Docker sandbox
• attach VS Code
• authenticate GitHub
• isolate work in .oh/worktrees
• open a normal PR

https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ If useful, star mifunedev/openharness on GitHub.
```

### Discord

```text
🧰 **Open Harness demo guide**

Fresh sandbox → VS Code attach → GitHub auth → isolated worktrees → first PR.

If you want a repeatable setup for coding agents without letting them loose on your laptop directly, this is the runbook:

https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ If useful, star mifunedev/openharness on GitHub.
```

### Telegram

```text
🧰 Open Harness demo guide is live.

Fresh sandbox → VS Code attach → GitHub auth → isolated worktrees → first PR.

https://oh.mifune.dev/blog/open-harness-demo-guide

⭐ Star mifunedev/openharness on GitHub if useful.
```

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

### Published link-card no-media posts

Published separate X-only and LinkedIn-only posts on 2026-07-08 after verifying the deployed blog page serves `summary_large_image` plus `og:image`/`twitter:image` metadata for `social-promo-card.jpg`.

- No Post Bridge media was attached (`media: null`); the direct blog URL is the only link so the platform-rendered card/banner can be clickable.
- X / JohnEggz post: `c2d45d22-bdfa-4c76-b37b-35222f728849`
  - Account: `41738`
  - Status: posted (`is_draft: false`, `scheduled_at: null`).
  - Result: `success: true`, <https://twitter.com/user/status/2074734574584705499>
  - X check: direct blog URL is the only link.
- LinkedIn / Ruska AI post: `05f06363-7027-4aad-b6f4-5e187c9ab455`
  - Account: `41732`
  - Status: posted (`is_draft: false`, `scheduled_at: null`).
  - Result: `success: true`, <https://www.linkedin.com/feed/update/urn:li:share:7480501537111191552>
  - Formatting check: no markdown `**bold**`; uses Unicode emphasis in the first line.
- Cadence: exactly one live replacement post per target account.

Note: the original LinkedIn draft `dee89070-6df1-4339-b13f-66fbb413762a` returned a Post Bridge 500 when patched live and remains a draft. It is superseded by live post `05f06363-7027-4aad-b6f4-5e187c9ab455`.

### Superseded replacement drafts

- No-link X draft: `98c67ed5-5a5e-489b-b051-acc6aad79e93`
- No-link LinkedIn draft: `3c0f224a-2f03-4b99-9520-eac889376c8c`
- No-link media ID: `fb9b7be4-3caf-4dbc-8d08-2da5941f7d5f`
- Protocol-less X draft: `94f87ae9-185d-4e7c-b79e-16935f7a4efd`
- Protocol-less LinkedIn draft: `bae96c7b-f8ec-46ef-bdd2-f3c7689b673d`
- Protocol-less media ID: `aeb1ed6c-92fc-4a82-9e01-9c26970e1e89`
- Separate X draft: `a6548d67-a3a5-415a-8bcd-d1faa94d8d93`
- Separate LinkedIn draft: `c17709bf-323c-4182-854a-04a687c42b03`
- Separate draft media ID: `1082bc74-74dd-4960-a98b-95496b14d222`
- Combined multi-account draft: `74655ecc-3aba-493d-bb87-0111a0ce42c8`
- Prior combined media ID: `1e400998-adb7-4edb-aaba-ff9e02840cbd`
- Superseded because a no-media direct blog URL card is preferred: the rendered banner/card should be clickable and the post should not carry a separate uploaded image.

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

Publication status for the replacement posts:

- [x] PR #11 is merged and <https://oh.mifune.dev/blog/open-harness-demo-guide> returns 200.
- [x] Do not attach uploaded Post Bridge media for the current replacement drafts; let the blog URL render the clickable platform card.
- [x] Confirm no screenshot exposes tokens, OAuth codes, private account details, or unwanted personal UI.
- [x] Keep LinkedIn copy as a post, not an article; link back to the blog.
- [x] Ensure the blog frontmatter has `image: /img/blog/2026-07-07-open-harness-demo-guide/social-promo-card.jpg`.
- [x] Verify the built blog HTML contains `summary_large_image`, `og:image`, and `twitter:image` for the promo card.
- [x] Before publishing, verify the live deployed HTML serves the specific promo-card `og:image`/`twitter:image`.
- [x] Limit replacement to one post per account for the day.
- [x] Keep X and LinkedIn as separate account-specific posts because formatting differs by platform.
- [x] Publish only after a fresh explicit `/post-bridge` confirmation gate.
- [x] Record live X and LinkedIn URLs above.
