---
title: "Your first sandbox: signing in gh, Claude, Pi, and Hermes"
description: "The image ships Claude, Codex, Pi, and (opt-in) Hermes. Standing up a useful sandbox is one docker run plus a round of logins — here's the full first run, and what a second sandbox on the same host does and does not inherit."
date: 2026-07-06
authors: [ryan]
tags: [docker, sandbox, auth, multi-agent]
slug: first-sandbox-agent-auth
---

:::note[Commands updated for the single home mount]

This post dates from 2026-07-06. Open Harness has since collapsed its many per-tool
volumes into a **single mount at `/home/sandbox`**, so the commands below have been
corrected to the current form and are safe to copy. The narrative is unchanged and still
reads as it did then.

One conclusion did change, and the second-sandbox section has been rewritten to say so: sharing logins
between sandboxes while keeping their workspaces separate is no longer something the
image-only path can do, because the workspace now lives *inside* the home mount.

Step 4 is new. Adding an optional harness used to mean a `--build-arg` and a rebuilt image;
`oh harness install` now provisions into the sandbox you already have running. See
[Installation](/docs/installation) and the [Docker deployment guide](/docs/docker-deployment).

:::

Open Harness is one sandbox per repo — an isolated Docker container with the whole agent toolchain baked in: Claude Code, Codex, Pi, and, when you opt into it, Hermes. Getting a *useful* sandbox is really two moves: boot the container once, then sign each agent in. This post walks the full first run — boot, attach, authenticate `gh`, Claude, Pi, and Hermes — and then stands up a **second** sandbox on the same host to show what it inherits.

<!-- truncate -->

## 1. Boot your first sandbox

We'll use the image-only path — pull the published image, no checkout, no local build. One mount at `/home/sandbox` carries everything the sandbox keeps: its `.oh/` control plane and repo, every agent login, the `gh` token, and your SSH key.

```bash
docker run -d --name oh-a --init \
  -e OH_IMAGE_ONLY=1 \
  -e SANDBOX_NAME=oh-a \
  -e GIT_USER_NAME="gituser" \
  -e GIT_USER_EMAIL="gituser@example.com" \
  -v oh_a_workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest sleep infinity
```

That single volume (`oh_a_workspace`) holds your work *and* your logins. `SANDBOX_NAME` is what tells the bundled `oh` CLI it is running *inside* a sandbox rather than on a host, which is what makes `oh harness install` work from the shell in step 4. The first run on a fresh host pulls the image once (public — no `docker login` needed). Confirm it's up:

```bash
docker ps --filter name=oh-a --format 'table {{.Names}}\t{{.Status}}'
```

> **Driving raw Docker?** Settings you'd put in `oh.json` under the `oh` CLI map to `-e` env vars on `docker run` (Slack tokens, `OH_PULL_POLICY`, …). Optional harnesses no longer need a `--build-arg`: `oh harness install <name>` adds one to a container that is already running — see step 4.

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

Walk the prompts: **GitHub.com**, **SSH** as the git protocol (let `gh` generate and upload a key), and **Paste an authentication token** as the login method — create a [personal access token](https://github.com/settings/tokens) with `repo`, `read:org`, and `admin:public_key` scopes and paste it. The token lands in `~/.config/gh` and the SSH key in `~/.ssh` — both inside the home mount, so both survive a container recreate.

### Claude Code

```bash
claude auth login      # OAuth to your Anthropic account
claude auth status     # confirm you're signed in
```

Launching a bare `claude` when unauthenticated starts the same flow, but `claude auth login` is the explicit, scriptable path. Credentials persist in `~/.claude/.credentials.json` inside the home mount; the sandbox banner reports Claude as authenticated once they exist.

### Pi

On a remote host Pi uses a **device login** by default — start Pi, then run `/login` inside it:

```bash
pi
# then, inside Pi:
/login                 # device-code flow: open the URL, enter the code, done
```

The device flow shows a URL and a code you complete in any browser, so no port forwarding is needed — ideal for a VM. (On a *local* machine Pi can instead use a subscription OAuth callback on `localhost:1455`, which VS Code forwards for you.) Pi's config and auth live in `~/.pi`, inside the home mount.

Two more things Pi does out of the box: it can run on **OpenAI Codex** (your ChatGPT subscription) through its built-in `openai-codex` provider — `/codex-status` shows your Codex usage without leaving Pi — and it bridges to **Slack**. On the raw-Docker path you preconfigure the bridge by passing its tokens straight to `docker run`:

```bash
  -e PI_SLACK_APP_TOKEN=xapp-…       # add these to the run command
  -e PI_SLACK_BOT_TOKEN=xoxb-…
```

Then `gateway pi` starts the bridge with the tokens already in place, and you grant trust from inside it with `/msg-bridge` ([Slack integration](/docs/integrations/slack)). (Under the `oh` CLI these same tokens live in `.devcontainer/.env`.)

### Hermes (opt-in)

Hermes — Nous Research's self-improving agent CLI — is **opt-in**, and the published
`ghcr.io/mifunedev/openharness:latest` does not carry it. When this post was written that
meant building your own image with `--build-arg INSTALL_HERMES=true`. It no longer does:
install it into the sandbox that is already running.

```bash
oh harness install hermes
```

That does both halves in one command — it installs `hermes` into the running container so it
is usable immediately, **and** records `install.hermes` in `oh.json` so the choice survives a
recreate. It never rebuilds or restarts the sandbox. Then set it up:

```bash
hermes setup           # interactive wizard (or: hermes setup --portal for Nous Portal OAuth)
hermes model           # pick the LLM provider — including OpenAI Codex
hermes doctor          # health check
```

Like Pi, Hermes can run on **OpenAI Codex** (choose it in `hermes model`) and has its own **Slack** gateway: `hermes gateway setup` configures the app and trust, then `gateway hermes` runs it in a `client-slack-hermes` session — `gateway status` shows both Pi's and Hermes' gateways side by side.

One thing to know for later: Hermes writes its auth to `~/harness/.hermes/auth.json`, alongside the repo rather than in a dotfile directory. Under the single home mount every one of these — Hermes included — is per sandbox.

That's it — `oh-a` is a fully signed-in sandbox. Start any agent (`claude`, `codex`, `pi`, `hermes`) and go.

## 4. Add anything else from the CLI — no rebuild

Everything above was about signing in what the image already ships. The other half of a
useful sandbox is adding what it does not, and that is a one-liner from inside the running
container. When this post was written it meant a `docker build --build-arg` and a fresh
container; today `oh` provisions in place.

```bash
oh harness list                 # what is known, enabled, and installed
oh harness install opencode     # an agent CLI, into the running sandbox
oh tool list                    # the non-agent tooling
oh tool install agent-browser   # ~1 GB — it asks first
```

`install` does **both halves**: it writes the `install.*` key into the tracked `oh.json` so
the choice survives a recreate, *and* installs into the container you are sitting in so it
is usable now. It never rebuilds or restarts the sandbox. The same command works from the
**host**, where it reaches into the running container; run it there with the sandbox stopped
and it records the flag, says so, and exits 0 rather than failing.

Two flags for when you want only one of the halves:

```bash
oh harness install grok-build --persist-only   # record the choice, touch nothing now
oh harness install grok-build --no-persist     # install now, leave oh.json alone
```

`oh harness status` and `oh tool status <name>` report what is actually present, with a
version where the tool has a version flag — worth running after an install rather than
trusting the success line.

:::note[Raw `docker run` needs `SANDBOX_NAME`]

`oh` decides whether it is inside a sandbox or on a host by looking for `/.dockerenv`
**and** a non-empty `SANDBOX_NAME`. The Compose path sets it for you; a hand-written
`docker run` must pass `-e SANDBOX_NAME=<name>`, as step 1 does. Without it, `oh` assumes it
is on the host and tries to reach the container through Docker Compose instead of just
installing locally.

:::

## 5. Optional follow-up: a second sandbox on the same host

Run the same command again with a new name and a new volume:

```bash
docker run -d --name oh-b --init \
  -e OH_IMAGE_ONLY=1 \
  -e SANDBOX_NAME=oh-b \
  -e GIT_USER_NAME="gituser" \
  -e GIT_USER_EMAIL="gituser@example.com" \
  -v oh_b_workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest sleep infinity
```

**It's instant.** No pull, no build — `oh-b` reuses the image `oh-a` already fetched. The
expensive part happened once; every sandbox after the first is a cache hit (seconds, not
minutes). The workspaces are independent — prove it:

```bash
docker exec oh-a bash -lc 'echo "I am A" > /home/sandbox/harness/WHOAMI'
docker exec oh-b bash -lc 'cat /home/sandbox/harness/WHOAMI 2>&1'   # No such file — B is isolated
```

:::warning[This is where the post's original payoff no longer holds]

As written in 2026, `oh-b` came up **already logged in**: the `gh`, Claude, Pi, and Codex
auth volumes were home-scoped and shared, while a separate workspace volume kept the repos
apart. You could have both.

With one mount at `/home/sandbox`, you cannot — on this image-only path. The workspace now
lives *inside* the home mount, so a second sandbox either gets its own home (separate
workspaces, **separate logins** — you sign in again in `oh-b`) or shares yours (shared
logins, **shared workspace**). This section's original "zero extra steps" is gone; the instant-start
half above is real and unchanged.

If you want the old combination, use the checkout-based path instead of image-only: there
the repo is bind-mounted at `/home/sandbox/harness` from the host, *over* the home mount, so
two sandboxes pointing `storage.homePath` at one directory share every credential while each
keeps its own checkout. See [Configuration → `storage.homePath`](/docs/configuration).

:::

Tear down containers without touching the seeded work:

```bash
docker rm -f oh-a oh-b
# fully clean slate (destructive — wipes the workspaces AND the logins):
docker volume rm oh_a_workspace oh_b_workspace
```

## Scenario: a whole team on one daily pull

This is the shape of a shared company harness. Everyone runs the same `ghcr.io/mifunedev/openharness:<tag>`, so the whole team has identical tooling — same Node, `gh`, and agent CLIs, down to the layer hash. To stay in lockstep, each dev pulls the current image each morning and recreates on it:

```bash
docker pull ghcr.io/mifunedev/openharness:latest
docker rm -f oh-a
# …then re-run the step-1 command: oh_a_workspace (work + logins) survives the recreate
```

A daily pull is safe because **the image version is a toolchain concern, not a correctness one** — your work and your logins live in the home mount, not in the image. A newer image swaps the tools under you without touching either. Want a reproducible floor? Pin a `<CalVer>` tag and bump it on your own cadence. One company image, N developers, one daily `docker pull` — and everyone signs in once.

Three moves: boot, attach, sign in. Do it once per sandbox home, and a daily image pull never costs you either.
