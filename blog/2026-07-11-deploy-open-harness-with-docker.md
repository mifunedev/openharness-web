---
title: "Deploy Open Harness with Docker"
description: "Start two isolated Open Harness workspaces from the public image while sharing agent authentication."
date: 2026-07-11
authors: [ryan]
tags: [open-harness, docker, deployment, self-hosted]
slug: deploy-open-harness-with-docker
---

:::note[Commands updated for the single home mount]

This post dates from 2026-07-11. Open Harness has since collapsed its many per-tool volumes
into a **single mount at `/home/sandbox`**, so every command below has been corrected to the
current form and is safe to copy. The narrative is unchanged.

One claim did change. Two sandboxes sharing auth volumes while keeping separate workspaces
is no longer possible on this image-only path — the workspace now lives *inside* the home
mount, so B either has its own home (its own logins) or shares A's entirely. The section on
sandbox B says so.

A section on provisioning from the CLI has also been added. Optional harnesses used to be a
`--build-arg` and a fresh image; `oh harness install` now adds one to a container that is
already running. See [Installation](/docs/installation) and the
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
  -e OH_IMAGE_ONLY=1 \
  -e SANDBOX_NAME=oh-a \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-a-workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

On first boot, `OH_IMAGE_ONLY=1` seeds `/opt/oh-seed` into the home mount and writes `/home/sandbox/harness/.oh/.image-seeded`. The mount is authoritative after that and starts without Git history.

```bash
docker ps --filter 'name=^/oh-a$' --format 'table {{.Names}}\t{{.Status}}'
docker exec oh-a test -f /home/sandbox/harness/.oh/.image-seeded \
  && echo "sandbox A seed ready"
docker exec -it -u sandbox oh-a zsh
```

For an editor, choose VS Code **Dev Containers: Attach to Running Container...**, select `oh-a`, and open `/home/sandbox/harness`. Do not use **Reopen in Container** for this path.

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

Inside Pi, enter `/login`, choose a provider and device auth, open the displayed URL in a browser, and enter its code. Then enter `/model` and select the provider and model Pi should use. Exit with `Ctrl-D` when setup is complete. GitHub config, SSH keys, Claude auth, and Pi auth persist in their four named volumes.

## Add sandbox B

Run the same image with `SANDBOX_NAME=oh-b`, container name `oh-b`, and a distinct workspace volume. Keep the network and auth mounts unchanged:

```bash
docker run -itd \
  --name oh-b \
  --network openharness \
  --restart unless-stopped \
  --init \
  -e OH_IMAGE_ONLY=1 \
  -e SANDBOX_NAME=oh-b \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-b-workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

B gets shared GitHub/SSH, Claude, and Pi auth without sharing A's files. No re-authentication is normally required, subject to provider session policies.

```bash
docker exec oh-a touch /home/sandbox/harness/.sandbox-a-only
docker exec oh-b test ! -e /home/sandbox/harness/.sandbox-a-only \
  && echo "workspaces are isolated"
docker exec oh-a rm /home/sandbox/harness/.sandbox-a-only
```

## Provision from the CLI once it is running

Both recipes above deliberately run the stock published image. Anything it does not ship —
another agent CLI, a headless browser, a tunnel client — goes in from inside the container,
with no rebuild and no recreate:

```bash
docker exec -it -u sandbox oh-a zsh

oh harness list                 # known agent CLIs, and their installed state
oh harness install opencode     # into the running sandbox
oh tool list                    # non-agent tooling
oh tool install agent-browser   # ~1 GB — it confirms first
```

`install` does both halves: it writes `install.*` into the tracked `oh.json` so the choice
survives a recreate, **and** installs into the container you are in. `--persist-only`
records the choice without touching the container; `--no-persist` does the reverse. The same
command works from the host against a running sandbox; with the sandbox stopped it records
the flag, says so, and exits 0 rather than failing.

This is why `SANDBOX_NAME` is set on every recipe on this page and not just for cosmetics:
`oh` decides it is *inside* a sandbox from `/.dockerenv` plus a non-empty `SANDBOX_NAME`.
Drop it and `oh` concludes it is on a host and goes looking for the container through Docker
Compose instead of installing locally.

## Compose equivalent

Compose is not required, but it records the same run as a file you can commit. This file starts sandbox A on the `openharness` network, and adds a fifth auth volume for Hermes.

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
      OH_IMAGE_ONLY: "1"
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
being precise about: on the published image that variable does **not** install Hermes. It
was a build argument — it selected whether the binary was baked in — and setting it at
runtime never added anything. Install Hermes the way you install any optional harness, from
inside the running sandbox (see below).

To make another container reachable from both sandboxes, attach it to their network with an optional DNS alias:

```bash
docker network connect --alias app openharness my-app
# A and B can now reach http://app:<container-port>
```

The alias is private to that Docker network; it does not publish a host port. These containers publish no ports and do not mount the host Docker socket. See the [Docker deployment guide](/docs/docker-deployment) for verification, lifecycle, destructive volume cleanup, the Linux/AMD64 caveat, and advanced source references.

Self-hosted Docker is available today. Open Harness Cloud is a future possibility, not a shipped service.
