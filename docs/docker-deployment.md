---
title: Docker deployment
sidebar_position: 3
---

# Docker deployment

Run the public Open Harness image directly with Docker—no checkout, local build, CLI wrapper, or Compose required. This walkthrough creates two containers on one private network, each with its own persistent home.

Everything a sandbox persists lives in a **single mount at `/home/sandbox`**: the workspace and control plane at `/home/sandbox/harness`, and the provider authentication under `/home/sandbox/.config`, `/home/sandbox/.ssh`, `/home/sandbox/.claude`, and `/home/sandbox/.pi`. One volume per sandbox, and nothing to keep in sync.

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
  -e SANDBOX_NAME=oh-a \
  -e GIT_USER_NAME="<your-name>" \
  -e GIT_USER_EMAIL="<you@example.com>" \
  -v oh-a_workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

`oh-a_workspace` is the whole sandbox home, and it is unique to A. The name follows the convention Compose uses—`<sandbox-name>_workspace`—so the same volume can later be adopted by the [image-only Compose file](https://github.com/mifunedev/openharness/blob/development/.devcontainer/docker-compose.image-only.yml) without moving data.

To keep the home on the host filesystem instead, replace the volume name with an absolute host path:

```bash
  -v /srv/openharness-a:/home/sandbox \
```

:::warning Use a dedicated directory
A host path must be a **dedicated, empty directory** that belongs to the sandbox alone. The entrypoint takes ownership of everything under `/home/sandbox` and seeds the baked home into it. Never point it at your real home directory, `~/.ssh`, or `~/.config`.
:::

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

Authentication persists in the `oh-a_workspace` volume with the rest of the home. Each sandbox owns its home, so authentication is per sandbox and does not cross between them. Do not put tokens in the Docker command.

## 5. Start sandbox B

Use the same image and network. Change the container identity and give B its own home volume:

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
  -v oh-b_workspace:/home/sandbox \
  ghcr.io/mifunedev/openharness:latest \
  sleep infinity
```

B boots from the same image with an isolated home, so repeat step 4 inside B to authenticate it.

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

The image ships with `/home/sandbox` deliberately empty and its baked home staged at `/opt/home-seed`. On first boot the entrypoint copies that home into whatever mount landed at `/home/sandbox`, which is why a named volume and a host bind behave identically.

With `OH_IMAGE_ONLY=1`, the entrypoint also copies the baked `/opt/oh-seed` control plane into `/home/sandbox/harness` and writes `.oh/.image-seeded`. After that, the mount is authoritative and is not overwritten on later boots or image updates. A seeded image-only workspace has no Git history; clone or initialize repositories inside it as needed.

## Lifecycle and security

Stop and restart either sandbox without losing state:

```bash
docker stop oh-a oh-b
docker start oh-a oh-b
```

Remove the containers while retaining both home volumes:

```bash
docker rm -f oh-a oh-b
```

Volume deletion is destructive. Because the home is one mount, removing it permanently deletes that sandbox's workspace **and** its authentication, and you must sign in again:

```bash
docker volume rm oh-a_workspace oh-b_workspace
```

No ports are published by these commands; the `openharness` network remains private until you deliberately add `-p HOST:CONTAINER`. The Docker socket is not mounted, so sandbox processes cannot control the host daemon. The published image is currently Linux/AMD64 only; hosts on another architecture are outside this happy path until a multi-architecture image is published.

## Full-option references

The `docker run` path above is the recommended walkthrough. For the complete image/boot model and advanced settings, see the [detailed prebuilt-image documentation](https://github.com/mifunedev/openharness/blob/development/.oh/docs/deployment-prebuilt-image.md). The [canonical image-only Compose file](https://github.com/mifunedev/openharness/blob/development/.devcontainer/docker-compose.image-only.yml) is available as a reference for operators who specifically need Compose-managed options.

## The same image runs under MicroSandbox

`msb` runs standard OCI images, so this image is also what you point MicroSandbox
at if you want a microVM rather than a container. The `docker run` recipe above is
the invocation to translate — see
[Running Open Harness on MicroSandbox](./runtimes/microsandbox.md#running-open-harness-on-microsandbox).
Untested end to end; the risks are listed there.
