---
title: "Deploy Open Harness with Docker"
description: "Start two isolated Open Harness workspaces from the public image while sharing agent authentication."
date: 2026-07-11
authors: [ryan]
tags: [open-harness, docker, deployment, self-hosted]
slug: deploy-open-harness-with-docker
---

:::note[Commands updated on 2026-09-02 for the one-door and sandbox-registry changes]

This post dates from 2026-07-11. Since it was written, mifunedev/openharness#948 and #950
changed the operator flow. Nothing installs at boot: the first commands inside a fresh sandbox
are `oh tool install herdr` and `oh harness install <id>`. `oh.json` has no `install.*` keys and
the `--persist-only` / `--no-persist` flags are gone. `oh sandbox install docker` creates a
sandbox from any directory; raw `docker run` — the subject of this post — remains the CLI-free
path, and `OH_IMAGE_ONLY` is no longer needed (the entrypoint detects image-only mode). The
command blocks below are rewritten to the current vocabulary; the narrative is kept as a record.

Open Harness had already collapsed its many per-tool volumes into a **single mount at
`/home/sandbox`**, and the commands reflect that too. One claim changed with it: two sandboxes
sharing auth volumes while keeping separate workspaces is no longer possible on this image-only
path — the workspace now lives *inside* the home mount, so B either has its own home (its own
logins) or shares A's entirely. The section on sandbox B says so.

See [Installation](/docs/installation) and the
[Docker deployment guide](/docs/docker-deployment).

:::

Open Harness publishes a ready-to-run sandbox image at `ghcr.io/mifunedev/openharness`. You can launch it directly with Docker—no checkout, local build, or CLI wrapper required—and keep each workspace isolated while sharing authentication. Compose is optional; a complete file is given below.

<!-- truncate -->

## Start sandbox A

Create a private Docker network and pull the newest release image:

```bash
docker network create openharness
docker pull ghcr.io/mifunedev/openharness:latest
```

Replace the Git identity placeholders and start A:

```bash
docker run -itd \
  --name oh-a \
  --network openharness \
  --restart unless-stopped \
  --init \
  -e SANDBOX_NAME=oh-a \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-a-workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

There is no flag for the image-only mode: the entrypoint detects it. Finding no checkout bound at `/home/sandbox/harness`, it seeds the image's baked `/opt/oh-seed` into the home mount on first boot and writes `/home/sandbox/harness/.oh/.image-seeded`. The mount is authoritative after that and starts without Git history.

```bash
docker ps --filter 'name=^/oh-a$' --format 'table {{.Names}}\t{{.Status}}'
docker exec oh-a test -f /home/sandbox/harness/.oh/.image-seeded \
  && echo "sandbox A seed ready"
docker exec -it -u sandbox oh-a zsh
```

For an editor, choose VS Code **Dev Containers: Attach to Running Container...**, select `oh-a`, and open `/home/sandbox/harness`. Do not use **Reopen in Container** for this path.

## Install what you use — nothing installs at boot

The published image carries no agent CLI. A fresh sandbox has Node and `gh`; everything else
enters through one door, from inside the container. Installs land in `~/.local` inside the home
mount, so they survive a container recreate:

```bash
docker exec -it -u sandbox oh-a zsh

oh tool install herdr && herdr   # persistent terminal workspace
oh harness install claude-code
oh harness install pi
oh harness install hermes        # optional
```

## Authenticate once

Inside A, run `gh auth login` and choose **GitHub.com** → **SSH** → generate/upload an SSH key → **Paste an authentication token**. Then authenticate Claude and Pi:

```bash
gh auth login       # GitHub.com → SSH → generate/upload key → paste token
gh auth setup-git
gh auth status
claude auth login
claude auth status
pi
```

Inside Pi, enter `/login`, choose a provider and device auth, open the displayed URL in a browser, and enter its code. Then enter `/model` and select the provider and model Pi should use. Exit with `Ctrl-D` when setup is complete. GitHub config, SSH keys, Claude auth, and Pi auth all live under `/home/sandbox`, so the single home volume carries them across a container recreate.

## Add sandbox B

Run the same image with `SANDBOX_NAME=oh-b`, container name `oh-b`, and a distinct home volume. Keep the network unchanged:

```bash
docker run -itd \
  --name oh-b \
  --network openharness \
  --restart unless-stopped \
  --init \
  -e SANDBOX_NAME=oh-b \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-b-workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

B gets its own home volume, so it does not see A's files — and, on this path, does not inherit A's logins either. Install and sign in again inside B. Pointing both containers at one home volume would share the credentials, but it would share the workspace with them.

```bash
docker exec oh-a touch /home/sandbox/harness/.sandbox-a-only
docker exec oh-b test ! -e /home/sandbox/harness/.sandbox-a-only \
  && echo "workspaces are isolated"
docker exec oh-a rm /home/sandbox/harness/.sandbox-a-only
```

## Add anything else from the CLI

Both recipes above deliberately run the stock published image, and the image ships no agent CLI
at all. Everything — another agent CLI, a headless browser, a tunnel client — goes in the same
way, from inside the running container, with no rebuild and no recreate:

```bash
docker exec -it -u sandbox oh-a zsh

oh harness list                 # known agent CLIs, and their installed state
oh harness install opencode     # into the running sandbox
oh tool list                    # non-agent tooling
oh tool install agent-browser   # ~1 GB — it confirms first
```

`oh harness install <id>` and `oh tool install <id>` are the only door, and they do one thing:
install into the running sandbox, so the tool is usable now. There is no recorded choice — the
sandbox's `oh.json` carries no install field, and there are no flags for splitting the work in
half. What makes an install stick is the home mount: it lands in `~/.local`, so it survives a
container recreate; after a recreate onto a fresh home volume, run the install again. The same
command works from the host against a running sandbox.

This is why `SANDBOX_NAME` is set on every recipe on this page and not just for cosmetics:
`oh` decides it is *inside* a sandbox from `/.dockerenv` plus a non-empty `SANDBOX_NAME`.
Drop it and `oh` concludes it is on a host and goes looking for the container through Docker
Compose instead of installing locally.

## Compose equivalent

Compose is not required, but it records the same run as a file you can commit. This file starts sandbox A on the `openharness` network with its single home volume.

Write `docker-compose.yml`:

```yaml
services:
  oh-a:
    image: ghcr.io/mifunedev/openharness:latest
    container_name: oh-a
    hostname: oh-a
    init: true
    tty: true
    stdin_open: true
    restart: unless-stopped
    networks:
      - openharness
    environment:
      SANDBOX_NAME: oh-a
      GIT_USER_NAME: ${GIT_USER_NAME:-<your-name>}
      GIT_USER_EMAIL: ${GIT_USER_EMAIL:-<you@example.com>}
      HERMES_HOME: /home/sandbox/.hermes
    volumes:
      - oh-a-workspace:/home/sandbox
    command: ["sleep", "infinity"]

networks:
  openharness:
    name: openharness

volumes:
  oh-a-workspace:
    name: oh-a-workspace
```

Start the sandbox and open a shell:

```bash
GIT_USER_NAME="<your-name>" GIT_USER_EMAIL="<you@example.com>" \
  docker compose up -d
docker compose exec -u sandbox oh-a zsh
```

Compose creates the network and the named volume on the first `up`, so the `docker network create` step is not needed. Add sandbox B as a second service: copy the `oh-a` block, set the service name, `container_name`, `hostname`, and `SANDBOX_NAME` to `oh-b`, and mount `oh-b-workspace` instead of `oh-a-workspace`. B gets its own home, which means its own logins — sign in again there. Pointing both services at one home volume would share the credentials, but it would share the workspace with them.

`HERMES_HOME` points at `/home/sandbox/.hermes`. As originally written this needed its own volume: Hermes replaces `auth.json` atomically, and an atomic replace across two filesystems fails with `EXDEV`, so `auth.json` and its temporary file had to share a mount. With one mount at `/home/sandbox` that is true by construction, and the extra volume is gone.

The `INSTALL_HERMES: "true"` line that used to sit beside it is gone too, and this is worth
being precise about: on the published image that variable never installed Hermes. It was a build
argument — it selected whether the binary was baked in — and setting it at runtime added
nothing. Today no harness is baked in at all. Install Hermes the way you install any harness in
the catalog — `claude-code`, `codex`, `pi`, `opencode`, `hermes`, `grok-build` — with
`oh harness install <id>` from inside the running sandbox, as the install section above does.

To make another container reachable from both sandboxes, attach it to their network with an optional DNS alias:

```bash
docker network connect --alias app openharness my-app
# A and B can now reach http://app:<container-port>
```

The alias is private to that Docker network; it does not publish a host port. These containers publish no ports and do not mount the host Docker socket. See the [Docker deployment guide](/docs/docker-deployment) for verification, lifecycle, destructive volume cleanup, the Linux/AMD64 caveat, and advanced source references.

Self-hosted Docker is available today. Open Harness Cloud is a future possibility, not a shipped service.
