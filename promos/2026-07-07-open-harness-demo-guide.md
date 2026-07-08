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

Use the first setup screenshot unless the platform link preview is enough:

- Local asset: `static/img/blog/2026-07-07-open-harness-demo-guide/install-prereqs.jpg`
- Public asset after merge: <https://oh.mifune.dev/img/blog/2026-07-07-open-harness-demo-guide/install-prereqs.jpg>
- Alt text: "Open Harness installer checking Docker, Docker Compose, and Git before cloning the repo."

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

https://oh.mifune.dev/blog/open-harness-demo-guide

#AIAgents #Docker #DeveloperTools

### LinkedIn — first comment / CTA

The original Loom walkthrough is here too: https://www.loom.com/share/875737ef981f4b378a005be62d1e435b

If you try it, the setup detail I would not skip is VS Code Dev Containers attach — it makes port forwarding and browser-based auth much less painful.

## X.com drafts

### X — single post

I wrote up the Open Harness demo: fresh machine → Docker sandbox → VS Code attach → GitHub auth → isolated `.oh/worktrees/` → first agent-created PR.

A repeatable place for coding agents to work.

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

## Posting checklist

Before posting:

- [ ] PR #11 is merged and <https://oh.mifune.dev/blog/open-harness-demo-guide> returns 200.
- [ ] Link preview renders correctly on LinkedIn and X.com.
- [ ] If attaching an image, use `install-prereqs.jpg` and the alt text above.
- [ ] Confirm no screenshot exposes tokens, OAuth codes, private account details, or unwanted personal UI.
- [ ] Keep LinkedIn copy as a post, not an article; link back to the blog.
- [ ] For X.com, choose either the single post or the thread, not both at the same time.
- [ ] Do not auto-publish from this artifact; review manually or hand off to `/post-bridge` with confirmation.
