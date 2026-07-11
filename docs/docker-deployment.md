---
title: Docker deployment
sidebar_position: 3
---

# Docker deployment

Open Harness publishes the same release image that its release workflow builds and smoke-tests:

```text
ghcr.io/mifunedev/openharness:latest
ghcr.io/mifunedev/openharness:<CalVer>   # for example, 2026.7.10
```

The image is public. Use `latest` for convenient toolchain updates, or pin a CalVer tag when you need reproducible recreation.

## Fastest path: an equipped project

If your repository is already equipped with Open Harness (`oh init`), run:

```bash
oh sandbox --image
oh shell
```

That is the recommended service quickstart. The image supplies the toolchain, while your bind-mounted repository—including Git history and the live `.oh/` control plane—remains authoritative. This is **Flavor A**: prebuilt tools, normal project ownership, and no local image build.

Pin a release per invocation when needed:

```bash
oh sandbox --image=ghcr.io/mifunedev/openharness:2026.7.10
```

Or make the choice durable without a settings dump:

```yaml title="harness.yaml"
sandbox:
  image: ghcr.io/mifunedev/openharness:latest
  pull_policy: always # optional; default pulls only when missing
```

At boot, the normal entrypoint still repairs provider links, starts configured cron sessions, and runs the repository dependency install only when its fingerprint changes. Skipping the image build does not skip project initialization.

See [Installation](./installation.md) if the project is not equipped yet. The [detailed prebuilt-image source](https://github.com/mifunedev/openharness/blob/development/.oh/docs/deployment-prebuilt-image.md) documents precedence, direct Compose usage, and the VS Code Dev Containers caveat.

## No checkout: image-only mode

**Flavor B** needs only Docker. It mounts a named workspace volume and, on first boot, copies the baked control plane from `/opt/oh-seed`. After that seed, the volume is authoritative and is not overwritten when the image changes. The seeded workspace has **no initial Git history**; clone or initialize repositories inside it as needed.

The canonical standalone Compose file includes health checks and optional credential volumes. Download and run it without cloning Open Harness:

```bash
curl -fsSLO https://raw.githubusercontent.com/mifunedev/openharness/development/.devcontainer/docker-compose.image-only.yml
OH_SANDBOX_IMAGE=ghcr.io/mifunedev/openharness:2026.7.10 \
  docker compose -f docker-compose.image-only.yml up -d
docker compose -f docker-compose.image-only.yml exec -u sandbox sandbox zsh
```

Review the [canonical Compose file](https://github.com/mifunedev/openharness/blob/development/.devcontainer/docker-compose.image-only.yml) before use. To use the newest release instead, omit `OH_SANDBOX_IMAGE` or set it to `ghcr.io/mifunedev/openharness:latest`.

For a deliberately minimal direct-Docker alternative:

```bash
docker volume create oh_workspace
docker run -d --name openharness --init \
  -e OH_IMAGE_ONLY=1 \
  -v oh_workspace:/home/sandbox/harness \
  ghcr.io/mifunedev/openharness:2026.7.10 sleep infinity
docker exec -it -u sandbox openharness zsh
```

Only the seeded workspace is mounted here. Agent credential/config volumes are optional; add only the providers you use, or use the canonical Compose file for the complete supported set. Authenticate interactively after attaching rather than placing personal credentials in commands.

## Operations and constraints

These details matter after the first successful shell, not before it:

- **Updates:** pull a newer tag and recreate the container. Reuse `oh_workspace`; an already seeded volume is not reseeded.
- **Stop or remove:** `docker compose ... down` (or `docker rm -f openharness`) retains named volumes. `docker compose ... down -v` or `docker volume rm oh_workspace` permanently erases the image-only workspace.
- **Architecture:** the published release is currently single-architecture (Linux/AMD64), not a multi-architecture manifest. Use a local build on other CPU architectures.
- **Networking:** no application ports are published by default. Add explicit mappings only for services you intend to expose.
- **Host control:** the Docker socket is not mounted by default. Mounting `/var/run/docker.sock` lets sandbox processes control the host Docker daemon and should be limited to trusted workloads.
- **Credentials:** named auth/config volumes persist sensitive state but are not backups. Protect and back them up appropriately.

For the full environment, volume, direct-Compose, VS Code, verification, and lifecycle options, use the [upstream detailed prebuilt-image guide](https://github.com/mifunedev/openharness/blob/development/.oh/docs/deployment-prebuilt-image.md).
