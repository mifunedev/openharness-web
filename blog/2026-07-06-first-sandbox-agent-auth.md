---
title: "Your first sandbox: signing in gh, Claude, Pi, and Hermes"
description: "The image ships Claude, Codex, Pi, and (opt-in) Hermes. Standing up a useful sandbox is one docker run plus a round of logins — here's the full first run, and why a second sandbox on the same host inherits every credential for free."
date: 2026-07-06
authors: [ryan]
tags: [docker, sandbox, auth, multi-agent]
slug: first-sandbox-agent-auth
---

Open Harness is one sandbox per repo — an isolated Docker container with the whole agent toolchain baked in: Claude Code, Codex, Pi, and, when you opt into it, Hermes. Getting a *useful* sandbox is really two moves: boot the container once, then sign each agent in. This post walks the full first run — boot, attach, authenticate `gh`, Claude, Pi, and Hermes — and then shows the payoff: stand up a **second** sandbox on the same host and it comes up instantly *and* already logged in.

<!-- truncate -->

## 1. Boot your first sandbox

We'll use the image-only path — pull the published image, no checkout, no local build. The sandbox gets its **own workspace volume** (its `.oh/` control plane and repo) and mounts a set of **shared, home-scoped auth volumes** so your logins persist and can be reused:

```bash
docker run -d --name oh-a --init \
  -e OH_IMAGE_ONLY=1 \
  -e OH_PROJECT_ROOT=/home/sandbox/harness \
  -e GIT_USER_NAME="gituser" \
  -e GIT_USER_EMAIL="gituser@example.com" \
  -v oh_ws_a:/home/sandbox/harness \
  -v claude-auth:/home/sandbox/.claude \
  -v codex-auth:/home/sandbox/.codex \
  -v pi-auth:/home/sandbox/.pi \
  -v gh-config:/home/sandbox/.config/gh \
  -v oh_ssh:/home/sandbox/.ssh \
  ghcr.io/mifunedev/openharness:latest sleep infinity
```

The workspace volume (`oh_ws_a`) holds your work; the auth/config volumes (Claude, Codex, Pi, `gh`, and your SSH key) hold your logins — that split is what makes the second sandbox below free. The first run on a fresh host pulls the image once (public — no `docker login` needed). Confirm it's up:

```bash
docker ps --filter name=oh-a --format 'table {{.Names}}\t{{.Status}}'
```

> **Driving raw Docker?** Settings you'd put in `harness.yaml` under the `oh` CLI map to Docker flags here: **runtime** knobs are `-e` env vars on `docker run` (Slack tokens, `OH_PULL_POLICY`, …), while **build-time** opt-ins like Hermes are `--build-arg`s on `docker build`. The examples below use both.

## 2. Attach — use VS Code

Attaching with **VS Code** is the nicest way in — Dev Containers extension → **Attach to Running Container** → `oh-a` opens a full editor *and* auto-forwards any app UIs you launch to your laptop ([Connecting → Option B](/docs/connecting#option-b--vscode-attach-to-running-container-local-host)). But every login below works headless — device codes, token paste, and OAuth URLs — so on a remote host a plain shell is enough:

```bash
docker exec -it -u sandbox oh-a zsh
```

Either way you land as the `sandbox` user, ready to sign in.

## 3. Sign in each agent

### GitHub CLI (`gh`)

The one you'll want first — it's how the agent pushes branches and opens PRs:

```bash
gh auth login          # GitHub.com → SSH → generate/upload a key → paste a token
```

Walk the prompts: **GitHub.com**, **SSH** as the git protocol (let `gh` generate and upload a key), and **Paste an authentication token** as the login method — create a [personal access token](https://github.com/settings/tokens) with `repo`, `read:org`, and `admin:public_key` scopes and paste it. The token lands in `~/.config/gh` (the `gh-config` volume) and the SSH key in `~/.ssh` (the `oh_ssh` volume) — both persist across recreation and are shared with any sandbox that mounts them.

### Claude Code

```bash
claude auth login      # OAuth to your Anthropic account
claude auth status     # confirm you're signed in
```

Launching a bare `claude` when unauthenticated starts the same flow, but `claude auth login` is the explicit, scriptable path. Credentials persist in `~/.claude/.credentials.json` via the `claude-auth` volume; the sandbox banner reports Claude as authenticated once they exist.

### Pi

On a remote host Pi uses a **device login** by default — start Pi, then run `/login` inside it:

```bash
pi
# then, inside Pi:
/login                 # device-code flow: open the URL, enter the code, done
```

The device flow shows a URL and a code you complete in any browser, so no port forwarding is needed — ideal for a VM. (On a *local* machine Pi can instead use a subscription OAuth callback on `localhost:1455`, which VS Code forwards for you.) Pi's config and auth live in `~/.pi`, mounted from the `pi-auth` volume.

Two more things Pi does out of the box: it can run on **OpenAI Codex** (your ChatGPT subscription) through its built-in `openai-codex` provider — `/codex-status` shows your Codex usage without leaving Pi — and it bridges to **Slack**. On the raw-Docker path you preconfigure the bridge by passing its tokens straight to `docker run`:

```bash
  -e PI_SLACK_APP_TOKEN=xapp-…       # add these to the run command
  -e PI_SLACK_BOT_TOKEN=xoxb-…
```

Then `gateway pi` starts the bridge with the tokens already in place, and you grant trust from inside it with `/msg-bridge` ([Slack integration](/docs/integrations/slack)). (Under the `oh` CLI these same tokens live in `.devcontainer/.env`.)

### Hermes (opt-in)

Hermes — Nous Research's self-improving agent CLI — is an **opt-in** harness, and the opt-in is a **build-time** choice: `hermes` is on `PATH` only if the image was built with it. The default image this post uses — `ghcr.io/mifunedev/openharness:latest` — is built **without** it, and because the binary is baked at build time, a runtime `-e INSTALL_HERMES=true` won't add it. To get Hermes you build your own image once:

```bash
docker build --build-arg INSTALL_HERMES=true \
  -f .devcontainer/Dockerfile -t openharness:hermes .
```

(The `harness.yaml` `install.hermes: true` key is just the `oh` CLI's front-end for that same build arg.) Run the `docker run` from step 1 against your `openharness:hermes` tag instead of `:latest`, and `hermes` is on `PATH`. Then set it up from inside the sandbox:

```bash
hermes setup           # interactive wizard (or: hermes setup --portal for Nous Portal OAuth)
hermes model           # pick the LLM provider — including OpenAI Codex
hermes doctor          # health check
```

Like Pi, Hermes can run on **OpenAI Codex** (choose it in `hermes model`) and has its own **Slack** gateway: `hermes gateway setup` configures the app and trust, then `gateway hermes` runs it in a `client-slack-hermes` session — `gateway status` shows both Pi's and Hermes' gateways side by side.

One thing to know for later: unlike the others, Hermes writes its auth to `~/harness/.hermes/auth.json` — **inside the workspace volume**, not a shared home volume. So Hermes is configured **per sandbox**, while `gh`, Claude, Pi, and Codex are shared across sandboxes.

That's it — `oh-a` is a fully signed-in sandbox. Start any agent (`claude`, `codex`, `pi`, `hermes`) and go.

## 4. Optional follow-up: a second sandbox on the same host

Here's the part worth trying once your first one works. Run the same command again — only `oh-a` → `oh-b` and `oh_ws_a` → `oh_ws_b` change; the auth volumes are identical:

```bash
docker run -d --name oh-b --init \
  -e OH_IMAGE_ONLY=1 \
  -e OH_PROJECT_ROOT=/home/sandbox/harness \
  -e GIT_USER_NAME="gituser" \
  -e GIT_USER_EMAIL="gituser@example.com" \
  -v oh_ws_b:/home/sandbox/harness \
  -v claude-auth:/home/sandbox/.claude \
  -v codex-auth:/home/sandbox/.codex \
  -v pi-auth:/home/sandbox/.pi \
  -v gh-config:/home/sandbox/.config/gh \
  -v oh_ssh:/home/sandbox/.ssh \
  ghcr.io/mifunedev/openharness:latest sleep infinity
```

Two things happen, both good:

- **It's instant.** No pull, no build — `oh-b` reuses the image `oh-a` already fetched. The expensive part happened once; every sandbox after the first is a cache hit (seconds, not minutes).
- **It's already logged in.** Because the `gh` config + SSH key, Claude, Pi, and Codex auth volumes are home-scoped and *shared*, `oh-b` inherits every credential you just set up in `oh-a`. Attach to `oh-b`, run `gh auth status` or `claude auth status`, and you're signed in with zero extra steps. (Hermes is the one exception — its auth lives in the per-sandbox workspace, so run `hermes setup` again in `oh-b`.)

The workspaces stay independent — prove it:

```bash
docker exec oh-a bash -lc 'echo "I am A" > /home/sandbox/harness/WHOAMI'
docker exec oh-b bash -lc 'cat /home/sandbox/harness/WHOAMI 2>&1'   # No such file — B is isolated
```

Same shared image, same shared logins, separate workspaces. That's two agents on one machine, each on its own branch, for the cost of one login round.

Tear down containers without touching the seeded work:

```bash
docker rm -f oh-a oh-b
# fully clean slate (destructive — wipes the workspaces):
docker volume rm oh_ws_a oh_ws_b
```

## Scenario: a whole team on one daily pull

This is the shape of a shared company harness. Everyone runs the same `ghcr.io/mifunedev/openharness:<tag>`, so the whole team has identical tooling — same Node, `gh`, and agent CLIs, down to the layer hash. To stay in lockstep, each dev pulls the current image each morning and recreates on it:

```bash
docker pull ghcr.io/mifunedev/openharness:latest
docker rm -f oh-a
# …then re-run the step-1 command: oh_ws_a (your work) and the auth volumes survive the recreate
```

A daily pull is safe because **the image version is a toolchain concern, not a correctness one** — your work lives in the workspace volume (and your logins in the auth volumes), not in the image. A newer image swaps the tools under you without touching either. Want a reproducible floor? Pin a `<CalVer>` tag and bump it on your own cadence. One company image, N developers, one daily `docker pull` — and everyone signs in once.

Three moves: boot, attach, sign in. Do it once, and the second sandbox — and the whole team — comes along for free.
