---
title: Docker deployment
sidebar_position: 3
---

# Docker deployment

Open Harness publishes a public, prebuilt sandbox image at:

```text
ghcr.io/mifunedev/openharness:latest
ghcr.io/mifunedev/openharness:<CalVer>   # for example, 2026.7.5
```

No GHCR login is required to pull it. Use `latest` for the newest release, or pin a CalVer tag for reproducible deployments. The release workflow builds, smoke-tests, and publishes both tags.

## Choose a deployment mode

| Mode | Host project | Workspace storage | Best for |
|---|---|---|---|
| Equipped-project prebuilt | Existing repo prepared with `oh init` | Bind-mounted project directory | Faster startup while retaining the host checkout |
| Image-only | No checkout or local build | Docker named volume, seeded on first boot | A true Docker-only deployment |

### Equipped-project prebuilt mode

From an equipped project, the recommended path is:

```bash
oh sandbox --image
# Reproducible pin:
oh sandbox --image=ghcr.io/mifunedev/openharness:2026.7.5
oh shell
```

`--image` skips the local image build, but it does **not** remove the project bind mount. Your host project, including its live `.oh/` control plane and Git history, remains authoritative; the image supplies the toolchain.

See [Installation](./installation.md) to equip a project and [Quickstart](./quickstart.md) for the normal workflow.

## Image-only: zero-checkout `docker run`

This path needs only Docker. It performs no checkout and no local build:

```bash
IMAGE=ghcr.io/mifunedev/openharness:2026.7.5
NAME=openharness

docker volume create oh_workspace
docker run -itd --name "$NAME" --restart unless-stopped --init \
  --add-host host.docker.internal:host-gateway \
  --health-cmd 'bash /home/sandbox/harness/.oh/scripts/sandbox-healthcheck.sh' \
  --health-interval 30s --health-timeout 10s --health-retries 3 \
  --health-start-period 300s \
  -e OH_IMAGE_ONLY=1 \
  -e OH_PROJECT_ROOT=/home/sandbox/harness \
  -e SANDBOX_NAME="$NAME" \
  -e SANDBOX_PASSWORD="${SANDBOX_PASSWORD:-test1234}" \
  -e TZ="${TZ:-America/Los_Angeles}" \
  -e CLAUDE_DANGEROUSLY_SKIP_PERMISSIONS=true \
  -e GIT_USER_NAME="Your Name" \
  -e GIT_USER_EMAIL="you@example.com" \
  -e GH_TOKEN="${GH_TOKEN:-}" \
  -e XAI_API_KEY="${XAI_API_KEY:-}" \
  -e CRONS_DIR=.oh/crons \
  -e CRON_AGENT_BIN=claude \
  -e MEMORY_DIR=.oh/memory \
  -e WORKTREES_DIR=.oh/worktrees \
  -v oh_workspace:/home/sandbox/harness \
  -v claude-auth:/home/sandbox/.claude \
  -v codex-auth:/home/sandbox/.codex \
  -v pi-auth:/home/sandbox/.pi \
  -v opencode-auth:/home/sandbox/.local/share/opencode \
  -v grok-auth:/home/sandbox/.grok \
  -v deepagents-auth:/home/sandbox/.deepagents \
  -v cloudflared-auth:/home/sandbox/.cloudflared \
  -v gh-config:/home/sandbox/.config/gh \
  "$IMAGE" sleep infinity
```

`OH_IMAGE_ONLY=1` selects no-bind mode. On the first boot, the entrypoint copies the baked control plane from `/opt/oh-seed` into `oh_workspace` and writes `.oh/.image-seeded`. Later boots and container recreations preserve the volume and do not overwrite it. This seeded workspace is a control-plane workspace, **not a Git checkout and not a repository with Git history**.

Use a release image that includes image-only seeding support. The release workflow currently publishes one Linux/AMD64 image, not a multi-architecture manifest; use a local build on ARM64 and other CPU architectures until multi-architecture images are published.

### Attach and verify

```bash
docker ps --filter name=openharness
docker logs --tail 100 openharness
docker exec openharness test -f /home/sandbox/harness/.oh/.image-seeded
docker exec -it -u sandbox openharness zsh   # bash is also available
```

A healthy first boot logs the seed operation and provider setup. The raw `docker run` recipe mirrors the source Compose healthcheck; verify status with `docker ps`, logs, and the marker check above.

### Update or recreate

Pinning makes updates explicit:

```bash
NEW_IMAGE=ghcr.io/mifunedev/openharness:<new-CalVer>
docker pull "$NEW_IMAGE"
docker rm -f openharness
# Repeat the docker run command with IMAGE="$NEW_IMAGE".
```

Reusing `oh_workspace` preserves the workspace. Pulling a newer image does not re-seed or replace operator edits in an already seeded volume.

### Stop and teardown

```bash
# Reversible: retain the container and all volumes
docker stop openharness
docker start openharness

# Remove the container but retain named volumes
docker rm -f openharness

# Destructive: permanently erase the image-only workspace
docker volume rm oh_workspace
```

Back up anything important before deleting `oh_workspace`.

## Image-only with Compose

The image-only Compose file is standalone, but a zero-checkout host does not already have it. Download it first:

```bash
curl -fsSLO https://raw.githubusercontent.com/mifunedev/openharness/development/.devcontainer/docker-compose.image-only.yml
OH_SANDBOX_IMAGE=ghcr.io/mifunedev/openharness:2026.7.5 \
  docker compose -f docker-compose.image-only.yml up -d

docker compose -f docker-compose.image-only.yml ps
docker compose -f docker-compose.image-only.yml logs -f sandbox
docker compose -f docker-compose.image-only.yml exec -u sandbox sandbox zsh
```

Update and recreate while preserving named volumes:

```bash
OH_SANDBOX_IMAGE=ghcr.io/mifunedev/openharness:<new-CalVer> \
  docker compose -f docker-compose.image-only.yml pull
OH_SANDBOX_IMAGE=ghcr.io/mifunedev/openharness:<new-CalVer> \
  docker compose -f docker-compose.image-only.yml up -d --force-recreate
```

`docker compose ... down` removes containers and the network but retains named volumes. `docker compose ... down -v` is destructive: it also deletes the seeded workspace and persisted agent credentials.

## Networking and host control

The default deployment publishes **no application ports**. Add explicit `-p HOST:CONTAINER` mappings to `docker run`, or a Compose override, only for services you intend to expose.

The Docker socket is also not mounted by default. Mounting `/var/run/docker.sock` is an opt-in host-control capability, not ordinary persistence: processes in the sandbox can then control the host Docker daemon and can effectively gain host-level access. Environment variables such as `GH_TOKEN` are also visible through Docker container inspection; prefer authenticating interactively into the persisted credential volumes when practical. Only enable socket access for trusted workloads, for example:

```bash
-v /var/run/docker.sock:/var/run/docker.sock
```
