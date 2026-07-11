---
title: "Deploy Open Harness with Docker"
description: "Start two isolated Open Harness workspaces from the public image while sharing agent authentication."
date: 2026-07-11
authors: [ryan]
tags: [open-harness, docker, deployment, self-hosted]
slug: deploy-open-harness-with-docker
---

Open Harness publishes a ready-to-run sandbox image at `ghcr.io/mifunedev/openharness`. You can launch it directly with Docker—no checkout, local build, CLI wrapper, or Compose required—and keep each workspace isolated while sharing authentication.

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

To make another container reachable from both sandboxes, attach it to their network with an optional DNS alias:

```bash
docker network connect --alias app openharness my-app
# A and B can now reach http://app:<container-port>
```

The alias is private to that Docker network; it does not publish a host port. These containers publish no ports and do not mount the host Docker socket. See the [Docker deployment guide](/docs/docker-deployment) for verification, lifecycle, destructive volume cleanup, the Linux/AMD64 caveat, and advanced source references.

Self-hosted Docker is available today. Open Harness Cloud is a future possibility, not a shipped service.
