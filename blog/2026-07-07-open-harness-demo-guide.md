---
title: "From Fresh Sandbox to First PR: An Open Harness Demo Guide"
description: "Install Open Harness, attach with VS Code, keep safe defaults, connect GitHub, isolate work in .oh/worktrees, and let an agent open its first PR."
date: 2026-07-07
authors: [ryan]
tags: [open-harness, docker, sandbox, github, worktrees]
slug: open-harness-demo-guide
---

The fastest way to understand Open Harness is to watch a clean machine become an agent-ready development environment: install the sandbox, attach an editor, verify the agents, connect GitHub, then let an agent create its first issue and pull request.

That is what the [full Loom walkthrough](https://www.loom.com/share/875737ef981f4b378a005be62d1e435b) shows. This post turns the demo into a written runbook, with the important corrections called out: safe defaults, when *not* to mount Docker, what lives in `.oh/`, and how worktrees keep agent work isolated.

<!-- truncate -->

## What the demo proves

Open Harness is a portable agent harness: one repo, one Docker sandbox, and one shared control plane for the coding agents you want to run. The host stays boring. Docker, Git, and `make` start the environment; Node, pnpm, `gh`, Claude Code, Codex, Pi, and optional tools live inside the container.

The end state is practical:

1. The sandbox is running.
2. VS Code can attach to it as a normal dev environment.
3. Agent CLIs can see the same repo context and `.oh/` primitives.
4. GitHub CLI is authenticated from inside the sandbox.
5. Agent work lands in isolated worktrees and can become a normal issue/PR workflow.

If you want the raw video alongside this guide, open the Loom: [Open Harness demo](https://www.loom.com/share/875737ef981f4b378a005be62d1e435b).

## 1. Install the sandbox

The demo starts from the one-line installer:

```bash
curl -fsSL https://oh.mifune.dev/install.sh | bash
```

The installer checks the host for the few things it actually needs: Docker with Compose, Git, and `make`/build essentials. It then resolves the Open Harness repo, writes local config, and starts the Docker build.

![Open Harness installer checking Docker, Docker Compose, and Git before cloning the repo.](/img/blog/2026-07-07-open-harness-demo-guide/install-prereqs.jpg)

Prefer to review first? Download the script before running it:

```bash
curl -fsSL -o openharness-install.sh https://oh.mifune.dev/install.sh
# inspect openharness-install.sh, then:
bash openharness-install.sh
```

For a long-lived setup, the docs recommend the clone-and-own path: clone `mifunedev/openharness`, edit `harness.yaml`, run `make sandbox`, then make your own repo the private `origin` and keep `mifunedev/openharness` as `upstream`. See [Installation](/docs/installation) and the [Quickstart](/docs/quickstart) for the full matrix.

## 2. Choose safe defaults

During setup, name the sandbox and decide which optional capabilities to include. In the demo the sandbox is named `oh-sbx-1`.

The default sandbox ships the core agent CLIs: **Claude Code**, **Codex**, and **Pi**. Other tools are optional image-level installs: **OpenCode**, **DeepAgents**, **Hermes**, **Grok Build**, and **agent-browser**. Turn them on only when you need them; optional browser support, for example, adds a headless Chromium footprint for screenshot and preview checks.

![Installer prompts for the sandbox name, optional components, and Docker socket access.](/img/blog/2026-07-07-open-harness-demo-guide/sandbox-options.jpg)

The most important prompt in this section is the host Docker socket. Mounting `/var/run/docker.sock` lets the sandbox manage host and sibling containers. That is powerful, but it is effectively host-level control. The safe default is **No**. Enable it only on a machine you trust and only when the agent really needs Docker control.

## 3. Let the build finish, then read the next-step commands

A cached build can finish quickly; a cold build can take several minutes. When it completes, the installer prints the files and commands that matter next:

- `harness.yaml` — shared, non-secret configuration.
- `.devcontainer/.env` — gitignored host defaults and secrets.
- `make shell` — enter the sandbox from the host.
- `make destroy` — tear it down later.

![Post-install instructions show how to enter the sandbox and configure GitHub.](/img/blog/2026-07-07-open-harness-demo-guide/post-install-lifecycle.jpg)

From the host checkout, entering the sandbox is intentionally boring:

```bash
cd ~/.openharness
make shell
```

You land as the `sandbox` user inside `/home/sandbox/harness`.

## 4. Attach with VS Code when you want the full workstation

A terminal shell is enough for CLI agents. For day-to-day work, VS Code Dev Containers is the nicer interface: attach to the running container, open `/home/sandbox/harness`, and keep the editor, terminal, file tree, and forwarded ports in one window.

![VS Code attaches directly to the running Open Harness container.](/img/blog/2026-07-07-open-harness-demo-guide/vscode-attach.jpg)

The key detail is port forwarding. `make shell` gives you a terminal, but it does not forward container ports to your laptop. VS Code Attach does. That matters for browser-based auth flows, Docusaurus previews, T3 Code, and any app UI running inside the sandbox.

The connection options are:

| Path | Best for | Port forwarding |
|---|---|---|
| `make shell` | quick terminal access | no |
| VS Code Dev Containers attach | local workstation flow | yes |
| VS Code Remote-SSH, then attach | remote VM/server flow | yes |

Full details are in [Connecting to the Sandbox](/docs/connecting).

## 5. Verify the harnesses share the same environment

The video checks Claude Code and Pi from the same sandbox. The point is not that every harness has identical UX. The point is that they are looking at the same repo, the same mounted workspace, and the same Open Harness control plane.

That control plane is `.oh/`:

- `.oh/context/` — durable instructions and operating context.
- `.oh/skills/` — shared skills exposed through provider-specific surfaces.
- `.oh/memory/` — session logs and durable lessons.
- `.oh/scripts/` — lifecycle and automation scripts.
- `.oh/worktrees/` — isolated task workspaces and project clones.

Use lowercase `.oh/`. The raw demo notes called it `.OH`; the repo path is `.oh/`.

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

Open Harness uses `.oh/worktrees/` for isolated work:

```text
.oh/worktrees/
  feat/my-task/                  # harness repo branch worktree
  project/<owner>/<repo>/        # independent project clones
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
- `make shell` lands inside `/home/sandbox/harness` as `sandbox`.
- VS Code attaches to the container and opens the same workspace.
- `claude`, `codex`, or `pi` starts inside the sandbox.
- `gh auth status` succeeds inside the sandbox.
- A test branch/worktree or project clone appears under `.oh/worktrees/`.
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
