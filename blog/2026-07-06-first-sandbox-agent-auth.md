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

We'll use the image-only path — pull the published image, no checkout, no local build. Each sandbox gets its **own workspace volume** (its `.oh/` control plane and repo) and mounts a set of **shared, home-scoped auth volumes** so your logins persist and can be reused. A tiny helper keeps this to one line per sandbox:

```bash
IMAGE=ghcr.io/mifunedev/openharness:latest

boot () {              # boot <letter>
  local id="$1"
  docker run -d --name "oh-$id" --restart unless-stopped --init \
    -e OH_IMAGE_ONLY=1 \
    -e OH_PROJECT_ROOT=/home/sandbox/harness \
    -e GIT_USER_NAME="gituser" \
    -e GIT_USER_EMAIL="gituser@example.com" \
    -v "oh_ws_${id}:/home/sandbox/harness" \
    -v claude-auth:/home/sandbox/.claude \
    -v codex-auth:/home/sandbox/.codex \
    -v pi-auth:/home/sandbox/.pi \
    -v gh-config:/home/sandbox/.config/gh \
    "$IMAGE" sleep infinity
}

boot a                 # your first sandbox: oh-a
```

The first `boot` on a fresh host pulls the image once (public — no `docker login` needed). Confirm it's up:

```bash
docker ps --filter name=oh-a --format 'table {{.Names}}\t{{.Status}}'
```

## 2. Attach — use VS Code

You can drop straight in with `docker exec -it -u sandbox oh-a zsh`, but for the logins below, **attach with VS Code** instead. The Dev Containers extension → **Attach to Running Container** → `oh-a` opens a window *and forwards the container's ports to your laptop* for the session. That port forwarding matters: Pi's login needs it (below). Details: [Connecting → Option B](/docs/connecting#option-b--vscode-attach-to-running-container-local-host).

Open a terminal inside that VS Code window and you're the `sandbox` user, ready to sign in.

## 3. Sign in each agent

### GitHub CLI (`gh`)

The one you'll want first — it's how the agent pushes branches and opens PRs:

```bash
gh auth login          # pick GitHub.com → HTTPS → login with a browser
gh auth setup-git      # let git use gh's credentials
```

Credentials land in `~/.config/gh`, mounted from the `gh-config` volume — so they survive container recreation and are shared with any other sandbox that mounts it.

### Claude Code

```bash
claude auth login      # OAuth to your Anthropic account
claude auth status     # confirm you're signed in
```

Launching a bare `claude` when unauthenticated starts the same flow, but `claude auth login` is the explicit, scriptable path. Credentials persist in `~/.claude/.credentials.json` via the `claude-auth` volume; the sandbox banner reports Claude as authenticated once they exist.

### Pi

Pi signs in with a subscription OAuth flow that spins up a **local callback server on `http://localhost:1455`** — which is exactly why you attached with VS Code. Just start Pi and follow the prompt:

```bash
pi                     # first run walks you through subscription login
```

Your browser completes the redirect to `localhost:1455` — VS Code (Attach, or Remote-SSH) forwards that loopback port automatically, so the callback lands with no extra step. Pi's config and auth live in `~/.pi`, mounted from the `pi-auth` volume. (Codex is here too if you use it: `codex login --device-auth` takes a headless device-code path and needs no port forwarding — its creds persist in the `codex-auth` volume.)

### Hermes (opt-in)

Hermes — Nous Research's self-improving agent CLI — is an **opt-in** harness. It's on `PATH` only if your image was built with `install.hermes: true` in `harness.yaml`. When it is, set it up from inside the sandbox:

```bash
hermes setup           # interactive wizard (or: hermes setup --portal for Nous Portal OAuth)
hermes doctor          # health check
```

One thing to know for later: unlike the others, Hermes writes its auth to `~/harness/.hermes/auth.json` — **inside the workspace volume**, not a shared home volume. So Hermes is configured **per sandbox**, while `gh`, Claude, Pi, and Codex are shared across sandboxes. (If your published image doesn't include Hermes, enable the flag and rebuild via the default `make sandbox` / Flavor A path.)

That's it — `oh-a` is a fully signed-in sandbox. Start any agent (`claude`, `codex`, `pi`, `hermes`) and go.

## 4. Optional follow-up: a second sandbox on the same host

Here's the part worth trying once your first one works. Run the exact same command with a new letter:

```bash
boot b                 # a second sandbox, same host
```

Two things happen, both good:

- **It's instant.** No pull, no build — `oh-b` reuses the image `oh-a` already fetched. The expensive part happened once; every sandbox after the first is a cache hit (seconds, not minutes).
- **It's already logged in.** Because the `gh`, Claude, Pi, and Codex auth volumes are home-scoped and *shared*, `oh-b` inherits every credential you just set up in `oh-a`. Attach to `oh-b`, run `gh auth status` or `claude auth status`, and you're signed in with zero extra steps. (Hermes is the one exception — its auth lives in the per-sandbox workspace, so run `hermes setup` again in `oh-b`.)

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
docker rm -f oh-a && boot a          # recreate on the fresh image; the workspace volume survives
```

A daily pull is safe because **the image version is a toolchain concern, not a correctness one** — your work lives in the workspace volume (and your logins in the auth volumes), not in the image. A newer image swaps the tools under you without touching either. Want a reproducible floor? Pin a `<CalVer>` tag and bump it on your own cadence. One company image, N developers, one daily `docker pull` — and everyone signs in once.

Three moves: boot, attach, sign in. Do it once, and the second sandbox — and the whole team — comes along for free.
