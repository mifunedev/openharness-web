---
title: Docker deployment
sidebar_position: 3
---

# Docker deployment

Run the public Open Harness image directly with Docker—no checkout, local build, CLI wrapper, or Compose required. This walkthrough creates two containers with isolated workspaces and shared GitHub, SSH, Claude, and Pi authentication.

## 1. Create the network and pull the image

```bash
docker network create openharness
docker pull ghcr.io/mifunedev/openharness:latest
```

`latest` follows the newest release. Pull it again when you want to update.

## 2. Start sandbox A

Replace the Git name and email placeholders, then run:

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

The workspace volume is unique to A. Only the auth state used in this walkthrough is shared.

## 3. Verify and attach

Confirm the container is running and that first-boot seeding completed:

```bash
docker ps --filter 'name=^/oh-a$' --format 'table {{.Names}}\t{{.Status}}'
docker logs oh-a
docker exec oh-a test -f /home/sandbox/harness/.oh/.image-seeded \
  && echo "sandbox A seed ready"
```

Attach from a terminal:

```bash
docker exec -it -u sandbox oh-a zsh
```

Or use VS Code with the Dev Containers extension:

1. Open the Command Palette.
2. Select **Dev Containers: Attach to Running Container...**.
3. Select `oh-a`.
4. Open `/home/sandbox/harness`.

This is **Attach to Running Container**, not **Reopen in Container**.

## 4. Authenticate inside sandbox A

Run these commands in A's shell.

### GitHub and SSH

```bash
gh auth login
```

Choose **GitHub.com** → **SSH** → allow `gh` to generate and upload an SSH key → **Paste an authentication token**. Then verify and configure Git:

```bash
gh auth setup-git
gh auth status
```

### Claude

```bash
claude auth login
claude auth status
```

### Pi

```bash
pi
```

Inside Pi, enter `/login`, choose a provider and device authentication, open the displayed browser URL on any device, enter the displayed code, and finish authorization. Then enter `/model` and select the provider and model you want Pi to use. Exit Pi with `Ctrl-D` when setup is complete.

Authentication persists in the named `oh-gh-config`, `oh-ssh`, `oh-claude-auth`, and `oh-pi-auth` volumes. Do not put tokens in the Docker command.

## 5. Start sandbox B with shared auth

Use the same image, network, and auth volumes. Change the container identity and give B its own workspace volume:

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

B starts with the shared GitHub/SSH, Claude, and Pi auth state but an isolated workspace. Re-authentication is normally unnecessary, subject to each provider's session and expiry policies.

Verify both seeds and prove that workspace content does not cross between them:

```bash
docker exec oh-b test -f /home/sandbox/harness/.oh/.image-seeded \
  && echo "sandbox B seed ready"
docker exec oh-a touch /home/sandbox/harness/.sandbox-a-only
docker exec oh-b test ! -e /home/sandbox/harness/.sandbox-a-only \
  && echo "A and B workspaces are isolated"
docker exec oh-a rm /home/sandbox/harness/.sandbox-a-only
```

## Optional: connect another service

Attach an existing container to the same private network so A and B can reach it:

```bash
docker network connect --alias app openharness my-app
```

`app` becomes that container's network-local DNS name. From either sandbox, connect to `http://app:<container-port>`. The alias is available only on the `openharness` network; it does not publish the service to the host or internet. Choose a short, unique alias, and omit `--alias app` if the container name is sufficient.

## First-boot and persistence model

With `OH_IMAGE_ONLY=1`, the entrypoint copies the baked `/opt/oh-seed` control plane into each empty workspace volume and writes `.oh/.image-seeded`. After that, the workspace volume is authoritative and is not overwritten on later boots or image updates. A seeded image-only workspace has no Git history; clone or initialize repositories inside it as needed.

## Lifecycle and security

Stop and restart either sandbox without losing state:

```bash
docker stop oh-a oh-b
docker start oh-a oh-b
```

Remove the containers while retaining all named volumes:

```bash
docker rm -f oh-a oh-b
```

Workspace deletion is destructive and permanently removes each sandbox's files:

```bash
docker volume rm oh-workspace-a oh-workspace-b
```

Auth deletion is also destructive and requires signing in again:

```bash
docker volume rm oh-gh-config oh-ssh oh-claude-auth oh-pi-auth
```

No ports are published by these commands; the `openharness` network remains private until you deliberately add `-p HOST:CONTAINER`. The Docker socket is not mounted, so sandbox processes cannot control the host daemon. The published image is currently Linux/AMD64 only; hosts on another architecture are outside this happy path until a multi-architecture image is published.

## Full-option references

The `docker run` path above is the recommended walkthrough. For the complete image/boot model and advanced settings, see the [detailed prebuilt-image documentation](https://github.com/mifunedev/openharness/blob/development/.oh/docs/deployment-prebuilt-image.md). The [canonical image-only Compose file](https://github.com/mifunedev/openharness/blob/development/.devcontainer/docker-compose.image-only.yml) is available as a reference for operators who specifically need Compose-managed options.
