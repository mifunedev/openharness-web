---
title: "Deploy Open Harness with Docker: a practical self-hosting path"
description: "Run Open Harness on infrastructure you control, skip the local cold build with the public image, and keep workspace and credentials persistent across container recreation."
date: 2026-07-11
authors: [ryan]
tags: [open-harness, docker, deployment, self-hosted]
slug: deploy-open-harness-with-docker
---

Self-hosting Open Harness does not have to mean assembling an agent workstation from scratch. If you already have a Docker host, you can run the published Open Harness image, attach to the sandbox, and keep the state that matters outside the container lifecycle.

This is the right path for developers and teams that want control over where their code and agent processes run, are comfortable operating Docker, and can own host security, backups, updates, and availability. It is also useful for an always-on machine where an agent should keep working after a laptop closes.

<!-- truncate -->

## Pull the environment instead of building it cold

Open Harness includes a substantial toolchain. Building that environment locally on a fresh host can take time because Docker must construct and cache every layer. The public image at `ghcr.io/mifunedev/openharness` moves that work out of the first deployment: Docker downloads prebuilt layers, then starts the same packaged environment without a local cold build.

For a quick evaluation, `latest` follows the current published image. For a reproducible deployment, pin a specific **CalVer tag** instead. A pinned tag makes recreation intentional and prevents a later pull from silently changing the toolchain you operate.

The complete commands, Compose configuration, update flow, and security choices live in the [Docker deployment guide](/docs/docker-deployment). Use that guide as the runbook rather than copying a one-off command from a blog post.

## Treat the container as replaceable

A durable deployment separates the runtime from its state. The container can be stopped, removed, and recreated from an image; the data you care about should live in mounted storage.

In the documented setup, persistence covers two categories:

- **Workspace state:** repositories, the `.oh/` control plane, task artifacts, and other files under the sandbox workspace.
- **User state:** agent credentials and configuration plus GitHub CLI authentication stored in mounted home-scoped volumes.

That separation makes image updates and container replacement routine without implying that persistence is a backup. Back up the mounted workspace and credential/config volumes according to your own recovery requirements, and protect them as sensitive data.

## Know what self-hosting asks of you

Docker provides a repeatable package, not a managed operations layer. You still choose and maintain the host, control network exposure, decide whether powerful capabilities such as Docker socket access are appropriate, monitor capacity, rotate credentials, and apply image updates.

That trade is attractive when infrastructure control matters or when a team already operates container workloads. It may be the wrong fit if nobody owns patching, backups, or incident response. Start with the smallest permissions and exposure the sandbox needs, then add capabilities deliberately.

## Self-hosted Docker is not Open Harness Cloud

This deployment model is Open Harness running on **your** infrastructure under **your** operational control. A future managed Open Harness Cloud would be a different product model: the managed service would take responsibility for parts of the operating experience that self-hosters handle themselves.

Open Harness Cloud is not being presented here as an available service, and this post makes no promises about its timing, pricing, architecture, or migration path. Docker self-hosting stands on its own today; choose it because its ownership model fits your needs, not as a placeholder for an announced transition.

## Start with the deployment guide

Before deploying, decide where the persistent data will live, who can access the host, which image tag you will run, and how updates and backups will work. Then follow [Deploy Open Harness with Docker](/docs/docker-deployment) for the supported setup and lifecycle options.

The short version is simple: pull a prebuilt image, keep state in mounted storage, pin a CalVer tag when reproducibility matters, and operate the host with the same care as any development system that holds source code and credentials.
