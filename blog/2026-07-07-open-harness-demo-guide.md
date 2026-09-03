---
title: "From Fresh Sandbox to First PR: An Open Harness Demo Guide"
description: "Install Open Harness, attach with VS Code, keep safe defaults, connect GitHub, isolate work in .worktrees, and let an agent open its first PR."
date: 2026-07-07
authors: [ryan]
tags: [open-harness, docker, sandbox, github, worktrees]
slug: open-harness-demo-guide
image: /img/blog/2026-07-07-open-harness-demo-guide/social-promo-card.jpg
---

:::note[Commands updated on 2026-09-02 for the one-door and sandbox-registry changes]

This post dates from 2026-07-07. Since it was written, mifunedev/openharness#948 and #950
changed the operator flow. Nothing installs at boot: the first commands inside a fresh sandbox
are `oh tool install herdr` and `oh harness install <id>`. `oh.json` has no `install.*` keys and
the `--persist-only` / `--no-persist` flags are gone. `oh sandbox install docker` creates a
sandbox from any directory; raw `docker run` remains the CLI-free path, and `OH_IMAGE_ONLY` is no
longer needed (the entrypoint detects image-only mode). The command blocks below are rewritten to
the current vocabulary; the narrative and the screenshots are kept as a record of the demo, and
the installer and wizard screens they show have since changed.

Two spellings in particular: `oh-sbx-1` is now the **default** sandbox name rather than one typed
during setup, and the `make ...` lifecycle commands are long gone — `oh` is the only door. For
commands that run today, see the [Quickstart](/docs/quickstart) and the
[lifecycle command reference](/docs/lifecycle-commands).

:::

The fastest way to understand Open Harness is to watch a clean machine become an agent-ready development environment: install the sandbox, attach an editor, verify the agents, connect GitHub, then let an agent create its first issue and pull request.

That is what the [full Loom walkthrough](https://www.loom.com/share/875737ef981f4b378a005be62d1e435b) shows. This post turns the demo into a written runbook, with the important corrections called out: safe defaults, when *not* to mount Docker, what lives in `.oh/`, and how worktrees keep agent work isolated.

<div style={{ position: "relative", paddingBottom: "56.25%", height: 0, margin: "2rem 0", overflow: "hidden", borderRadius: "12px" }}>
  <iframe
    src="https://www.loom.com/embed/875737ef981f4b378a005be62d1e435b"
    title="From Fresh Sandbox to First PR: An Open Harness Demo Guide"
    frameBorder="0"
    webkitallowfullscreen="true"
    mozallowfullscreen="true"
    allowFullScreen
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
  />
</div>

<!-- truncate -->

## What the demo proves

Open Harness is a portable agent harness: one repo, one Docker sandbox, and one shared control plane for the coding agents you want to run. The host stays boring — Docker, Git, and Node.js ≥ 20 are all it needs. Node, pnpm, and `gh` live inside the container, and the agent CLIs you use are installed into it with `oh harness install <id>`.

The end state is practical:

1. The sandbox is running.
2. VS Code can attach to it as a normal dev environment.
3. Agent CLIs can see the same repo context and `.oh/` primitives.
4. GitHub CLI is authenticated from inside the sandbox.
5. Agent work lands in isolated worktrees and can become a normal issue/PR workflow.

If you want the raw video alongside this guide, open the Loom: [Open Harness demo](https://www.loom.com/share/875737ef981f4b378a005be62d1e435b).

## 1. Install the sandbox

The demo starts from the one-line installer. Today it gets the `oh` CLI, and the sandbox is one
command after it:

```bash
curl -fsSL https://oh.mifune.dev/get-oh.sh | bash
oh sandbox install docker
```

The host needs only three things: Docker with the Compose plugin, Git, and Node.js ≥ 20 —
`get-oh.sh` offers to install Node for you when it is missing. `oh sandbox install docker` then
runs from **any** directory, with no checkout: it asks for the sandbox name, the timezone, your
git identity, whether to run sshd, and whether to mount the host Docker socket, writes the
answers to a registry entry at `~/.oh/sandboxes/<name>/oh.json`, and starts the container from
the published image. `--yes` takes every default.

![Open Harness installer checking Docker, Docker Compose, and Git before cloning the repo.](/img/blog/2026-07-07-open-harness-demo-guide/install-prereqs.jpg)

Prefer to review first? Download the script before running it:

```bash
curl -fsSL -o get-oh.sh https://oh.mifune.dev/get-oh.sh
# inspect get-oh.sh, then:
bash get-oh.sh
```

For a long-lived setup, the docs recommend the clone-and-own path: clone
`mifunedev/openharness`, then point a sandbox at that checkout from inside it —

```bash
oh sandbox install docker --repo "$PWD" --name openharness
```

— which bind-mounts the clone at `/home/sandbox/harness`. Then make your own repo the private
`origin` and keep `mifunedev/openharness` as `upstream`. See [Installation](/docs/installation)
and the [Quickstart](/docs/quickstart) for the full matrix.

## 2. Choose safe defaults

During setup, name the sandbox and answer the access prompts. In the demo the sandbox is named `oh-sbx-1`, which is now simply the default.

The wizard no longer asks which agent CLIs to include, because none of them are in the image. Nothing installs at boot: inside the sandbox you run `oh tool install herdr` for the terminal workspace and `oh harness install <id>` for each agent you want — `claude-code`, `codex`, `pi`, `opencode`, `hermes`, or `grok-build`. Install only what you need; `oh tool install agent-browser`, for example, adds a headless Chromium footprint for screenshot and preview checks.

![Installer prompts for the sandbox name, optional components, and Docker socket access.](/img/blog/2026-07-07-open-harness-demo-guide/sandbox-options.jpg)

The most important prompt in this section is the host Docker socket. Mounting `/var/run/docker.sock` lets the sandbox manage host and sibling containers. That is powerful, but it is effectively host-level control. The safe default is **No**. Enable it only on a machine you trust and only when the agent really needs Docker control.

## 3. Let the build finish, then read the next-step commands

A cached build can finish quickly; a cold build can take several minutes. When it completes, the installer prints the files and commands that matter next:

- `~/.oh/sandboxes/oh-sbx-1/oh.json` — the sandbox's own settings, and the one file there you edit.
- `oh secret set --sandbox oh-sbx-1 KEY value` — secrets, written to the sibling `.env` beside it at mode `0600`.
- `oh shell oh-sbx-1` — enter the sandbox from the host.
- `oh destroy oh-sbx-1` — tear it down later.

![Post-install instructions show how to enter the sandbox and configure GitHub.](/img/blog/2026-07-07-open-harness-demo-guide/post-install-lifecycle.jpg)

From anywhere on the host, entering the sandbox is intentionally boring:

```bash
oh shell oh-sbx-1   # the name is optional when it is your only sandbox
```

You land as the `sandbox` user inside `/home/sandbox/harness`.

## 4. Attach with VS Code when you want the full workstation

A terminal shell is enough for CLI agents. For day-to-day work, VS Code Dev Containers is the nicer interface: attach to the running container, open `/home/sandbox/harness`, and keep the editor, terminal, file tree, and forwarded ports in one window.

![VS Code attaches directly to the running Open Harness container.](/img/blog/2026-07-07-open-harness-demo-guide/vscode-attach.jpg)

The key detail is port forwarding. `oh shell oh-sbx-1` gives you a terminal, but it does not forward container ports to your laptop. VS Code Attach does. That matters for browser-based auth flows, Docusaurus previews, T3 Code, and any app UI running inside the sandbox.

The connection options are:

| Path | Best for | Port forwarding |
|---|---|---|
| `oh shell oh-sbx-1` | quick terminal access | no |
| VS Code Dev Containers attach | local workstation flow | yes |
| VS Code Remote-SSH, then attach | remote VM/server flow | yes |

Full details are in [Connecting to the Sandbox](/docs/connecting).

## 5. Verify the harnesses share the same environment

The video checks Claude Code and Pi from the same sandbox. The point is not that every harness has identical UX. The point is that they are looking at the same repo, the same mounted workspace, and the same Open Harness control plane.

That control plane is `.oh/`:

- `.oh/README.md` — the namespace anchor and the governing-principle doc for the control plane.
- `.oh/manifest.json` — the `oh update` payload allowlist.
- `.oh/skills.lock` — the pinned lockfile for the vendored skill pack.
- `.oh/cli/` — the in-tree `oh` CLI, built into the image.
- `.oh/evals/` — the fitness-function suite: regression probes, the capability benchmark, and its scoreboard.
- `.oh/hooks/` — provider-portable secret-exposure hook scripts.
- `.oh/install/` — container-install inputs consumed while building and booting the sandbox.
- `.oh/knowledge/` — durable repository knowledge: source and pattern pages, and raw snapshots.
- `.oh/scripts/` — installer, lifecycle, cron-runtime, and eval-support scripts.
- `.oh/skills/` — the vendored provider-portable skill pack, exposed through provider symlinks.
- `.oh/tasks/` — spec task workdirs.

Use lowercase `.oh/`. The raw demo notes called it `.OH`; the repo path is `.oh/`. Isolated
worktrees are *not* under `.oh/` — they live at `.worktrees/` at the repo root, as the next
section shows.

A useful smoke test is to ask each harness to run a small health check or inspect the repo. If Claude Code and Pi can both see the same `.oh/` tree and repo files, the portability story is working.

## 6. Connect GitHub inside the sandbox

GitHub auth belongs inside the sandbox because that is where the agents run `git`, `gh`, and PR commands.

```bash
gh auth login
gh auth setup-git
```

For the clone-and-own flow, choose **SSH** during `gh auth login`, let `gh` generate/upload a key, then paste a GitHub token if prompted. The usual scopes are `repo`, `read:org`, and `admin:public_key`; include `workflow` if the agent will create repos or touch workflow-related operations.

Two guardrails:

- Open Harness does not create a token for you. You create or supply the token, then `gh` stores it in the sandbox config volume.
- Do not paste tokens into prompts, screenshots, blog posts, or memory files. Use `gh auth login`, environment variables, or the documented secret paths.

The full flow is in [GitHub integration](/docs/integrations/github). For a deeper auth-focused walkthrough, see [Your first sandbox: signing in gh, Claude, Pi, and Hermes](/blog/first-sandbox-agent-auth).

## 7. Use worktrees for isolated agent work

Once the sandbox is authenticated, the next habit is isolation. Agent tasks should not all mutate the same checkout.

Open Harness uses `.worktrees/` at the repo root for isolated work, with independent project
clones alongside it under `projects/`:

```text
.worktrees/
  feat/my-task/                  # harness repo branch worktree
projects/
  <owner>/<repo>/                # independent project clones
```

That gives you two useful modes:

- **Branch worktrees** for Open Harness changes, where each task gets its own branch checkout.
- **Project clones** for separate repositories an agent creates or works on from inside the harness.

In the demo, the agent is asked to create a new public repo and scaffold initial work from inside the sandbox. That proves the chain: Open Harness can go from install → editor attach → GitHub auth → agent-owned project setup without leaving the isolated environment.

![The agent opens an issue and begins the branch and pull-request workflow for a demo repository.](/img/blog/2026-07-07-open-harness-demo-guide/first-agent-issue.jpg)

The raw Loom screenshots show a public demo repo named `test-demo-openharness`. Treat that as a throwaway example, not a naming rule.

## 8. What to verify before you call it done

A good setup run has observable checkpoints:

- `docker ps` shows the sandbox container running.
- `oh shell oh-sbx-1` lands inside `/home/sandbox/harness` as `sandbox`.
- VS Code attaches to the container and opens the same workspace.
- `claude`, `codex`, or `pi` starts inside the sandbox.
- `gh auth status` succeeds inside the sandbox.
- A test branch/worktree appears under `.worktrees/`, or a project clone under `projects/`.
- A demo issue/PR appears in GitHub when the agent is asked to scaffold work.

If Docker-specific checks fail from inside the sandbox, check whether you intentionally left the host Docker socket unmounted. That is not automatically a bad setup; it is the safer default.

## Main takeaway

Open Harness is meant to make agent setup repeatable. You boot a sandbox once, attach the interface you prefer, authenticate the tools inside the container, and let agents work in isolated repo state instead of directly on your laptop.

If the sandbox runs on an always-on remote host, the agent can keep working after your local laptop closes. If it runs on your laptop, it stops when that machine sleeps. The durability comes from the host you choose plus the sandboxed workspace, not from magic.

Start here:

- [Installation](/docs/installation)
- [Quickstart](/docs/quickstart)
- [Connecting to the Sandbox](/docs/connecting)
- [GitHub integration](/docs/integrations/github)
- [Harnesses overview](/docs/harnesses/overview)

Then run the loop yourself: install, attach, authenticate, isolate, and open the first PR from inside the sandbox.
