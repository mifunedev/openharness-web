---
sidebar_position: 3
title: "Quickstart"
---

# Quickstart

This guide takes you from zero to a running sandbox with an interactive shell in under five minutes. Required host dependencies are [Docker](https://docs.docker.com/get-docker/) with the Compose plugin, [Git](https://git-scm.com/), and `make` (build-essential) — the full list with install commands is in [Prerequisites](./installation.md#prerequisites). To run the public image with no checkout or build, use the [Docker deployment guide](/docs/docker-deployment).

## Before you start

Install Docker with the Compose plugin ([docs.docker.com/get-docker](https://docs.docker.com/get-docker/)), Git ([git-scm.com](https://git-scm.com/)), and `make` (build-essential — `sudo apt-get install build-essential` on Debian/Ubuntu, Xcode Command Line Tools on macOS). Node, Python, pnpm, and agent CLIs run inside the container.

## Install

The recommended path is **clone-and-own** — clone upstream, edit `.devcontainer/.env`, then build
(same as the [README](https://github.com/mifunedev/openharness#-install)). To then make the
sandbox *yours* with a private repo + upstream, continue with the
[end-to-end walkthrough](#end-to-end-setup-walkthrough) below.

```bash
# 1. Clone upstream:
git clone https://github.com/mifunedev/openharness.git ~/.openharness && cd ~/.openharness

# 2. Edit .devcontainer/.env BEFORE building — set SANDBOX_NAME, TZ,
#    GIT_USER_NAME, GIT_USER_EMAIL, optional INSTALL_* keys (see Configuration below):
cp .devcontainer/.example.env .devcontainer/.env
nano .devcontainer/.env

# 3. Build the image (~10 min cold, ~30s warm):
make sandbox
```

<details>
<summary>Other install methods (one-line installer · fork-and-clone)</summary>

```bash
curl -fsSL https://oh.mifune.dev/install.sh | bash
```

Review-first alternative, without adding a host dependency:

```bash
curl -fsSL -o openharness-install.sh https://oh.mifune.dev/install.sh
# Review openharness-install.sh in your editor or pager before running it.
bash openharness-install.sh
```

The installer clones into `~/.openharness`, prompts to share your host `gh` token, creates `.devcontainer/.env` from `.devcontainer/.example.env` when missing and writes your answers into it, and brings the sandbox up via `docker compose`.

**Self-hosting from an existing clone:** run `bash .oh/scripts/install.sh` from inside the directory — it detects the local clone automatically.

**Standalone `oh` CLI (equip an existing project repo):** if you already have Node.js ≥ 20, install the `oh` command from npm — `npm install -g @mifune/openharness` (or zero-install `npx @mifune/openharness init`). Otherwise bootstrap it with `curl -fsSL https://oh.mifune.dev/get-oh.sh | bash` (or `source <(curl -fsSL https://oh.mifune.dev/get-oh.sh)` to also put `oh` on the current shell's PATH). Then `cd <your-project> && oh init` → `oh sandbox` / `oh shell` / `oh gateway` — see [Installation → Standalone CLI](./installation.md#standalone-cli-oh-equip-an-existing-repo). Requires Node.js ≥ 20 (get-oh.sh offers nvm + Node 22 if missing); Docker only for `oh sandbox`.

</details>

## Enter the sandbox

**Recommended: attach with VS Code's Dev Containers extension.** Works identically whether the sandbox is on your laptop or on a remote host you're SSH'd into (with VS Code's Remote-SSH extension). One window, your normal editor, integrated terminal, file tree — the most consistent and productive setup across environments.

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).
2. Open the Command Palette with `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS) → **Dev Containers: Attach to Running Container...** → select `openharness`.
3. When the new VS Code window opens, set the workspace folder to `/home/sandbox/harness`.

> **Optional — DebugMCP (cross-harness debugging).** If you take the VS Code attach route
> above, you can install the `microsoft/DebugMCP` extension to expose a debugging MCP server
> that **any MCP-capable harness** (Claude Code, Codex, …) can drive — breakpoints, stepping,
> variable inspection. It is not tied to one agent and is unnecessary for the terminal path.
> Runbook: [DebugMCP](./integrations/debugmcp.md#confirmed-setup-runbook).

**Terminal fallback** for when VS Code isn't available or you just need a shell:

```bash
cd ~/.openharness
make shell
```
Pass an optional container name to attach to a different running container, e.g. `make shell portfolio-advisor` (add `SHELL_USER=<user>` if the target has no `sandbox` user).

Either way you're inside the isolated sandbox as the `sandbox` user. Working
directory: `/home/sandbox/harness`.

## Pick your harness

The default sandbox ships with Claude Code, Codex, and Pi. OpenCode,
DeepAgents, Hermes, and Grok Build are optional image-level installs; T3 Code runs on
demand via the `/t3` skill or direct `npx`. Authenticate at least one harness before use.

> **Simplest cross-provider login — device mode via `/login`.** The most straightforward path
> that works the same across most harnesses: launch the agent in **interactive mode**, run
> **`/login`**, and choose **device mode** (device-auth). You get a short code + a URL to open
> in a browser on *any* device — no local browser on the host required, so it works cleanly on
> a **headless or remote sandbox** (e.g. a cloud VM you SSH into). Browser-redirect OAuth
> assumes a local browser and often fails there; device mode doesn't. The per-harness commands
> below are equivalents for when you prefer a one-liner — several expose an explicit
> `--device-auth` flag (e.g. `codex login --device-auth`, `grok login --device-auth`).

- **[Claude Code](./harnesses/claude-code.md)**: `claude auth login` (or `/login` in an interactive session), then `claude auth status` to verify
- **[Codex](./harnesses/codex.md)**: `codex login --device-auth` (device mode; or `/login` in-session)
- **[OpenCode](./harnesses/opencode.md)**: `oh harness install opencode` (no rebuild), then run `opencode auth login`
- **[Pi](./harnesses/pi.md)**: configure provider keys via environment variables
- **[DeepAgents](./harnesses/deepagents.md)**: `oh harness install deepagents` (no rebuild), then write provider keys to `~/.deepagents/.env`
- **[Hermes](./harnesses/hermes.md)**: `oh harness install hermes` (no rebuild), then run `hermes setup`
- **[Grok Build](./harnesses/grok-build.md)**: `oh harness install grok-build` (no rebuild), verify `grok --version`, then run `grok login --device-auth` (headless/remote) or `grok login`
- **[T3 Code](./harnesses/t3code.md)**: authenticate one of Claude / Codex / OpenCode, then `/t3` or `npx t3` (browser UI on port 3773)

Claude Code remains the documented default. See
[the harnesses overview](./harnesses/overview) for the full list and
per-harness setup.

[Connecting to the Sandbox](/docs/connecting)

If `GH_TOKEN` was set during install, the entrypoint already ran
`gh auth login` and `gh auth setup-git` for you. Otherwise run them once
inside the shell:

```bash
gh auth login && gh auth setup-git
```

## Configuration

`.devcontainer/.env` is the **one** configuration file. It is gitignored and generated from tracked `.devcontainer/.example.env` — by the installer, by `oh init`, or by hand. Every key in the template is commented out (defaults shown), so a fresh copy changes nothing; uncomment a key to take it over.

It works on **every** path. `make ...` and `oh ...` pass it to compose with `--env-file`; the VS Code "Reopen in Container" path loads `.devcontainer/docker-compose.yml` directly, and compose auto-loads the `.env` beside it. (Before 0.4.0 a `harness.yaml` layer sat in front of this file and was readable on the first path only, so a key set there silently did nothing under VS Code. It was removed; any leftover `harness.yaml` is migrated into `.env` automatically on the next lifecycle command.)

```bash
# .devcontainer/.env — non-secret settings (example)
SANDBOX_NAME=openharness
TZ=UTC
GIT_USER_NAME=your-name           # spaces are fine, no quotes needed
GIT_USER_EMAIL=you@example.com
INSTALL_OPENCODE=false
INSTALL_DEEPAGENTS=false
INSTALL_HERMES=false
INSTALL_GROK_BUILD=false
INSTALL_AGENT_BROWSER=false
```

The template also documents the SSH, Docker-socket, Hermes-dashboard, cron, and prebuilt-image keys (all commented out by default). See `.devcontainer/.example.env` for every available key and its default.

**Secrets** — keep in `.devcontainer/.env` only (gitignored):

| Var | Purpose |
|-----|---------|
| `GH_TOKEN` | GitHub token for non-interactive auth |
| `PI_SLACK_APP_TOKEN` | Slack Socket Mode app token (`xapp-`) |
| `PI_SLACK_BOT_TOKEN` | Slack bot token (`xoxb-`) |

**Non-secret settings** — same file, same format:

| Key | Purpose |
|-----|---------|
| `SANDBOX_NAME` | Container/compose project name |
| `TZ` | Container timezone |
| `GIT_USER_NAME` | Commit author name (spaces OK) |
| `GIT_USER_EMAIL` | Commit author email |
| `INSTALL_AGENT_BROWSER` | Set `true` to install Chromium (~1 GB) — or run `oh tool install agent-browser` |
| `INSTALL_OPENCODE` | Set `true` to include OpenCode in the sandbox image |
| `INSTALL_DEEPAGENTS` | Set `true` to include DeepAgents in the sandbox image |
| `INSTALL_HERMES` | Set `true` to include Hermes in the sandbox image; state defaults to `~/harness/.hermes`, auth lives in `~/.hermes` |
| `INSTALL_GROK_BUILD` | Set `true` to include Grok Build in the sandbox image; all Grok user state lives in the persisted `~/.grok` volume |

Apply changes with `make destroy && make sandbox`. `oh harness install <name>` and
`oh tool install <name>` write these `INSTALL_*` keys for you and install into the running
sandbox, so a rebuild is only needed for keys they do not cover.

For additional services (databases, tunnels, reverse proxies), add overlay
paths to `composeOverrides[]` in `.oh/config.json` (gitignored, last wins). A
list is the one thing `.env` cannot hold, which is why that file survived the
collapse of every other configuration surface.

## End-to-end setup walkthrough

The full path from a bare Linux host to an authenticated multi-agent sandbox. Each step
inlines the command to run; follow the link for depth/troubleshooting. Steps 5–13 run
**inside the sandbox** (`make shell`). For the agent-auth steps (8–11), the simplest
cross-provider method is `/login` → **device mode** inside each agent's interactive session
(see [Pick your harness](#pick-your-harness)); the explicit commands shown are equivalents.

1. **Install host prerequisites** — Docker (+ Compose), Git, and `make`
   ([details](./installation.md#prerequisites)):
   ```bash
   sudo apt-get install -y build-essential   # provides make (Debian/Ubuntu)
   ```
2. **Clone the repo** to `~/.openharness`:
   ```bash
   git clone --recurse-submodules https://github.com/mifunedev/openharness.git ~/.openharness
   cd ~/.openharness
   ```
3. **Edit `.devcontainer/.env`** — set `SANDBOX_NAME`, `TZ`, `GIT_USER_NAME`,
   `git.user_email`, and any optional installs (see [Configuration](#configuration) above).
4. **Build and enter the sandbox**:
   ```bash
   make sandbox        # build + start (~10 min cold)
   make shell          # attach as the sandbox user
   ```
5. **Authenticate GitHub over SSH** — choose SSH, generate a key, paste a token
   ([GitHub auth](./integrations/github.md)):
   ```bash
   gh auth login && gh auth setup-git
   ```
6. **Create your own private repo**:
   ```bash
   gh repo create <your-user>/openharness --private
   ```
7. **Point remotes at your repo + upstream** (SSH, so the step-5 key is used;
   [clone-and-own](./installation.md#clone-and-own-private-origin-and-upstream-recommended)):
   ```bash
   git remote set-url origin git@github.com:<your-user>/openharness.git
   git remote add upstream git@github.com:mifunedev/openharness.git
   git push -u origin HEAD
   ```
8. **Authenticate Claude Code** ([Claude Code](./harnesses/claude-code.md)):
   ```bash
   claude auth login && claude auth status
   ```
9. **Authenticate Codex** ([Codex](./harnesses/codex.md)):
   ```bash
   codex login --device-auth
   ```
   > Optional: DebugMCP (cross-harness debugging over MCP) is available if you attached via
   > VS Code — see [Enter the sandbox](#enter-the-sandbox) above, not this step.
10. **Authenticate Pi** — configure provider keys / OAuth ([Pi](./harnesses/pi.md)):
    ```bash
    pi        # first run walks provider auth
    ```
11. **Authenticate Hermes** (optional; needs `INSTALL_HERMES=true`) ([Hermes](./harnesses/hermes.md)):
    ```bash
    hermes setup
    ```
12. **Configure Slack** for Pi (and Hermes) — create the Slack app, add tokens, set trust
    ([Slack](./integrations/slack.md); Hermes uses `hermes gateway setup`).
13. **Run and verify the gateways** (sandbox-only; watch read-only so you can't kill them —
    [Slack § Run and verify](./integrations/slack.md), [Hermes § Run and verify](./harnesses/hermes.md#run-and-verify-read-only)):
    ```bash
    gateway pi && gateway hermes        # start the client-slack-* sessions
    gateway status                      # both sessions + state
    tmux attach -r -t client-slack-pi   # read-only view; detach with Ctrl-b d
    ```

> Shortcut: if `GH_TOKEN` was set at install, the entrypoint already ran `gh auth login`
> + `gh auth setup-git` and generated/uploaded an SSH key for you (steps 5 partly done).

## Tear down

When you're finished, exit the shell and clean up from the host:

```bash
make destroy
```

This stops the container and removes its volumes. To keep auth credentials across rebuilds, stop without removing volumes:

```bash
make stop
```

Bring it back later with `make sandbox`.

Inside the sandbox — and in any repo equipped by `oh init`, which has no Makefile — the
same verbs are `oh stop`, `oh restart`, `oh logs`, `oh ps`, and `oh sandbox`. See
[Lifecycle commands](./lifecycle-commands.md) for the full mapping.
