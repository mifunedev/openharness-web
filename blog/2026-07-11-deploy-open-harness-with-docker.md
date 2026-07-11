---
title: "Deploy Open Harness with Docker: a practical self-hosting path"
description: "Start Open Harness from its published image, either with an equipped repository or in a Docker-only seeded workspace."
date: 2026-07-11
authors: [ryan]
tags: [open-harness, docker, deployment, self-hosted]
slug: deploy-open-harness-with-docker
---

Open Harness releases include a public sandbox image at `ghcr.io/mifunedev/openharness`. It is the same image the release workflow already builds and smoke-tests, so a Docker host can pull the toolchain instead of spending a cold build on it.

There are two useful modes: keep an existing repository authoritative, or start with no checkout at all.

<!-- truncate -->

## Mode 1: accelerate an equipped repository

From a repository prepared with `oh init`, this is the complete quickstart:

```bash
oh sandbox --image
oh shell
```

The published image supplies the toolchain. Your bind-mounted repository, Git history, and live `.oh/` control plane still supply the project. Boot also repairs provider links, starts configured crons, and runs the fingerprint-gated repository dependency install when needed.

`latest` is a practical default because the image is a toolchain convenience rather than the authoritative project state. For reproducible recreation, pin a release instead:

```bash
oh sandbox --image=ghcr.io/mifunedev/openharness:2026.7.10
oh shell
```

## Mode 2: start with Docker only

With no checkout, download the canonical standalone Compose file and start a seeded workspace:

```bash
curl -fsSLO https://raw.githubusercontent.com/mifunedev/openharness/development/.devcontainer/docker-compose.image-only.yml
OH_SANDBOX_IMAGE=ghcr.io/mifunedev/openharness:2026.7.10 \
  docker compose -f docker-compose.image-only.yml up -d
docker compose -f docker-compose.image-only.yml exec -u sandbox sandbox zsh
```

On first boot, Open Harness copies `/opt/oh-seed` into the `oh_workspace` volume. The volume then becomes authoritative and survives image pulls or container recreation; it is not reseeded over your edits. This workspace starts without Git history, so clone or initialize the project you want from inside the sandbox.

The [canonical Compose file](https://github.com/mifunedev/openharness/blob/development/.devcontainer/docker-compose.image-only.yml) carries the supported health check and optional credential volumes. The [detailed upstream model](https://github.com/mifunedev/openharness/blob/development/.oh/docs/deployment-prebuilt-image.md) explains the boot and persistence contract.

## Operate it deliberately

The happy path publishes no application ports and does not mount the Docker socket. Keep it that way until a workload needs more access: mounting the socket gives sandbox processes effective control of the host Docker daemon.

The release image is currently single-architecture (Linux/AMD64). Pull a newer tag and recreate the container to update; preserve the workspace volume. Normal container teardown retains named volumes, while teardown with `-v` permanently deletes the seeded workspace and persisted credentials.

Use the [Docker deployment guide](/docs/docker-deployment) for lifecycle commands, security notes, direct `docker run`, durable image settings, credential persistence, and full options.

Self-hosted Docker is available today and leaves host operations with you. A managed Open Harness Cloud is a possible future offering, not a shipped service.
