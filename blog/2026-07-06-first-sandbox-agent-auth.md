---
title: "Your first sandbox: signing in gh, Claude, Pi, and Hermes"
description: "Nothing is baked into the image — you install Claude, Codex, Pi, or Hermes yourself. Standing up a useful sandbox is one docker run, one round of installs, and a round of logins — here's the full first run, and what a second sandbox on the same host does and does not inherit."
date: 2026-07-06
authors: [ryan]
tags: [docker, sandbox, auth, multi-agent]
slug: first-sandbox-agent-auth
---

:::note[Commands updated on 2026-09-02 for the one-door and sandbox-registry changes]

This post dates from 2026-07-06. Since it was written, mifunedev/openharness#948 and #950
changed the operator flow. Nothing installs at boot: the first commands inside a fresh sandbox
are `oh tool install herdr` and `oh harness install <id>`. `oh.json` has no `install.*` keys and
the `--persist-only` / `--no-persist` flags are gone. `oh sandbox install docker` creates a
sandbox from any directory; raw `docker run` remains the CLI-free path, and `OH_IMAGE_ONLY` is no
longer needed (the entrypoint detects image-only mode). The command blocks below are rewritten to
the current vocabulary; the narrative and screenshots are kept as a record.

Open Harness had already collapsed its many per-tool volumes into a **single mount at
`/home/sandbox`**, and the commands below reflect that too. One conclusion changed with it, and
the second-sandbox section has been rewritten to say so: sharing logins between sandboxes while
keeping their workspaces separate is no longer something the image-only path can do, because the
workspace now lives *inside* the home mount.

See [Installation](/docs/installation) and the [Docker deployment guide](/docs/docker-deployment).

:::

Open Harness is one sandbox per repo — an isolated Docker container with nothing baked in. The image pins Node and `gh`; the agent CLIs you use (Claude Code, Codex, Pi, OpenCode, Hermes, Grok Build) each enter through one command, `oh harness install <id>`. Getting a *useful* sandbox is really three moves: boot the container once, install what you use, then sign each agent in. This post walks the full first run — boot, attach, install, authenticate `gh`, Claude, Pi, and Hermes — and then stands up a **second** sandbox on the same host to show what it inherits.

<!-- truncate -->

## 1. Boot your first sandbox

We'll use the image-only path — pull the published image, no checkout, no local build. One mount at `/home/sandbox` carries everything the sandbox keeps: its `.oh/` control plane and repo, every agent login, the `gh` token, and your SSH key.

```bash
docker run -d --name oh-a --init \
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

> **Driving raw Docker?** Settings you'd put in `oh.json` under the `oh` CLI map to `-e` env vars on `docker run` (Slack tokens, `OH_PULL_POLICY`, …). Harnesses never needed a `--build-arg`: `oh harness install <id>` adds one to a container that is already running — see step 3.

## 2. Attach — use VS Code

Attaching with **VS Code** is the nicest way in — Dev Containers extension → **Attach to Running Container** → `oh-a` opens a full editor *and* auto-forwards any app UIs you launch to your laptop ([Connecting → Option B](/docs/connecting#option-b--vscode-attach-to-running-container-local-host)). But every login below works headless — device codes, token paste, and OAuth URLs — so on a remote host a plain shell is enough:

```bash
docker exec -it -u sandbox oh-a zsh
```

Either way you land as the `sandbox` user, ready to sign in.

## 3. Sign in each agent

### Install what you use first — nothing installs at boot

Nothing is baked into the image. A fresh sandbox has Node and `gh` and little else; every agent
CLI enters through `oh harness install <id>` and every tool through `oh tool install <id>`.
Installs land in `~/.local` inside the home mount, so they survive a container recreate.

```bash
oh tool install herdr && herdr   # persistent terminal workspace — run your agents in its panes
oh harness install claude-code
oh harness install pi
oh harness install hermes        # optional
```

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

Then `gateway pi` starts the bridge with the tokens already in place, and you grant trust from inside it with `/msg-bridge` ([Slack integration](/docs/integrations/slack)). (Under the `oh` CLI these same tokens are set with `oh secret set --sandbox <name> PI_SLACK_BOT_TOKEN <value>`, which writes them to the sandbox's registry entry.)

### Hermes

Hermes — Nous Research's self-improving agent CLI — is a harness like any other, and the
published `ghcr.io/mifunedev/openharness:latest` does not carry it (or any other agent CLI).
When this post was written, adding it meant building your own image with a `--build-arg`. Today
it is the same one door as everything else, which the install block above already used:

```bash
oh harness install hermes
```

That installs `hermes` into the running container so it is usable immediately. There is no
recorded choice anywhere — `oh` never rebuilds or restarts the sandbox, and if you recreate onto
a fresh home volume you run the command again. Then set it up:

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

`oh harness install <id>` and `oh tool install <id>` are the only door, and they do one thing:
install into the running sandbox, so the tool is usable now. There is no second half — no
recorded choice, no install field in `oh.json`, and no flags for picking between halves. Nothing
rebuilds and nothing restarts. What makes an install stick is the home mount: it lands in
`~/.local`, so it survives a container recreate, and after a recreate onto a *fresh* home volume
you simply run the install again. The same command works from the **host** against a running
sandbox.

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

This is the shape of a shared company harness. Everyone runs the same `ghcr.io/mifunedev/openharness:<tag>`, so the whole team has an identical base — the image pins Node and `gh` down to the layer hash. The agent CLIs are not in the image: each sandbox installs the ones it uses with `oh harness install <id>`, and those installs live in that sandbox's home mount. To stay in lockstep, each dev pulls the current image each morning and recreates on it:

```bash
docker pull ghcr.io/mifunedev/openharness:latest
docker rm -f oh-a
# …then re-run the step-1 command: oh_a_workspace (work + logins) survives the recreate
```

A daily pull is safe because **the image version is a toolchain concern, not a correctness one** — your work and your logins live in the home mount, not in the image. A newer image swaps the tools under you without touching either. Want a reproducible floor? Pin a `<CalVer>` tag and bump it on your own cadence. One company image, N developers, one daily `docker pull` — and everyone signs in once.

Three moves: boot, attach, sign in. Do it once per sandbox home, and a daily image pull never costs you either.
