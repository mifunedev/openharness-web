---
title: "Deploy Open Harness with Docker"
description: "Start two isolated Open Harness workspaces from the public image while sharing agent authentication."
date: 2026-07-11
authors: [ryan]
tags: [open-harness, docker, deployment, self-hosted]
slug: deploy-open-harness-with-docker
---

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
  -e OH_PROJECT_ROOT=/home/sandbox/harness \
  -e SANDBOX_NAME=oh-a \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-workspace-a:/home/sandbox/harness \
  -v oh-gh-config:/home/sandbox/.config/gh \
  -v oh-ssh:/home/sandbox/.ssh \
  -v oh-claude-auth:/home/sandbox/.claude \
  -v oh-pi-auth:/home/sandbox/.pi \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

On first boot, `OH_IMAGE_ONLY=1` seeds `/opt/oh-seed` into the workspace volume and writes `/home/sandbox/harness/.oh/.image-seeded`. The volume is authoritative after that and starts without Git history.

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
  -e OH_PROJECT_ROOT=/home/sandbox/harness \
  -e SANDBOX_NAME=oh-b \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-workspace-b:/home/sandbox/harness \
  -v oh-gh-config:/home/sandbox/.config/gh \
  -v oh-ssh:/home/sandbox/.ssh \
  -v oh-claude-auth:/home/sandbox/.claude \
  -v oh-pi-auth:/home/sandbox/.pi \
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
      OH_PROJECT_ROOT: /home/sandbox/harness
      SANDBOX_NAME: oh-a
      GIT_USER_NAME: ${GIT_USER_NAME:-<your-name>}
      GIT_USER_EMAIL: ${GIT_USER_EMAIL:-<you@example.com>}
      INSTALL_HERMES: "true"
      HERMES_HOME: /home/sandbox/.hermes
    volumes:
      - oh-workspace-a:/home/sandbox/harness
      - oh-gh-config:/home/sandbox/.config/gh
      - oh-ssh:/home/sandbox/.ssh
      - oh-claude-auth:/home/sandbox/.claude
      - oh-pi-auth:/home/sandbox/.pi
      - oh-hermes-auth:/home/sandbox/.hermes
    command: ["sleep", "infinity"]

networks:
  openharness:
    name: openharness

volumes:
  oh-workspace-a:
    name: oh-workspace-a
  oh-gh-config:
    name: oh-gh-config
  oh-ssh:
    name: oh-ssh
  oh-claude-auth:
    name: oh-claude-auth
  oh-pi-auth:
    name: oh-pi-auth
  oh-hermes-auth:
    name: oh-hermes-auth
```

Start the sandbox and open a shell:

```bash
GIT_USER_NAME="<your-name>" GIT_USER_EMAIL="<you@example.com>" \
  docker compose up -d
docker compose exec -u sandbox oh-a zsh
```

Compose creates the network and every named volume on the first `up`, so the `docker network create` step is not needed. Add sandbox B as a second service: copy the `oh-a` block, set the service name, `container_name`, `hostname`, and `SANDBOX_NAME` to `oh-b`, and mount `oh-workspace-b` instead of `oh-workspace-a`. Keep the network and the auth volumes the same, and B inherits A's logins without sharing A's files.

`HERMES_HOME` points at the `oh-hermes-auth` volume. Hermes replaces `auth.json` atomically, and an atomic replace across two filesystems fails with `EXDEV`. This mount keeps `auth.json` and its temporary file on one filesystem. To keep Hermes state in the workspace volume instead, remove the `HERMES_HOME` variable and the `oh-hermes-auth` mount.

To make another container reachable from both sandboxes, attach it to their network with an optional DNS alias:

```bash
docker network connect --alias app openharness my-app
# A and B can now reach http://app:<container-port>
```

The alias is private to that Docker network; it does not publish a host port. These containers publish no ports and do not mount the host Docker socket. See the [Docker deployment guide](/docs/docker-deployment) for verification, lifecycle, destructive volume cleanup, the Linux/AMD64 caveat, and advanced source references.

Self-hosted Docker is available today. Open Harness Cloud is a future possibility, not a shipped service.
