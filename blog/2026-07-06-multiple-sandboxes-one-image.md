---
title: "One image, many sandboxes: spinning up A, B, and C on a single host"
description: "The prebuilt image is fetched once. Every sandbox after the first reuses the cache and comes up in seconds — so standing up three isolated agents on one machine is three docker run commands, not three ten-minute builds."
date: 2026-07-06
authors: [ryan]
tags: [docker, sandbox, image-only, multi-agent]
slug: multiple-sandboxes-one-image
---

Open Harness is one sandbox per repo. That framing is deliberate — an agent gets an isolated Docker container, its own branch, its own workspace, and it can thrash around without touching your laptop. But "one sandbox per repo" quietly implies a second thing people ask about the moment they get it: *can I run more than one at a time on the same box?*

Yes. And the interesting part is how cheap the second and third ones are. The sandbox image is fetched — pulled or built — exactly **once** per host. Every sandbox you start after that reuses the cached image and comes up in the time it takes Docker to create a container: seconds, not minutes. So three isolated agents on one machine is three `docker run` lines, not three ten-minute builds.

<!-- truncate -->

## The one thing that's slow, and why you only pay for it once

A from-scratch sandbox image build — Node, `gh`, the Docker CLI, cloudflared, bun, uv, pnpm, and the agent CLIs — is about **ten minutes on a cold cache**. That's the number that scares people off running several sandboxes.

It shouldn't, because you never pay it more than once per host. Docker caches image layers. Whether you **build** locally (Flavor A) or **pull** the published image from GHCR (the image-only path), the result is the same: the image lands in your host's local image store, and every container you start from that ref after the first is a cache hit. No pull, no build — just `docker create` + `docker start`.

```
ghcr.io/mifunedev/openharness:latest      # newest release, prebuilt + smoke-tested
ghcr.io/mifunedev/openharness:<CalVer>    # e.g. 2026.7.6 — pin for reproducibility
```

The published image is public, so pulling it needs no `docker login`. The first sandbox on a fresh host pulls it once; A, B, and C below share that single cached image.

## The demo: three sandboxes, one host

We'll stand up three fully independent sandboxes — call them **A**, **B**, and **C** — using the image-only path (no checkout, no build). Each gets:

- its **own container** (`oh-a`, `oh-b`, `oh-c`),
- its **own workspace volume** (`oh_ws_a`, `oh_ws_b`, `oh_ws_c`) — this is what keeps their `.oh/` control planes and repos isolated from each other,
- **shared auth volumes** (`claude-auth`, `gh-config`) so you log in once and all three inherit it.

A small helper function keeps the three calls identical except for the name:

```bash
IMAGE=ghcr.io/mifunedev/openharness:latest

boot () {           # boot <letter>
  local id="$1"
  docker run -d --name "oh-$id" --restart unless-stopped --init \
    -e OH_IMAGE_ONLY=1 \
    -e OH_PROJECT_ROOT=/home/sandbox/harness \
    -e GIT_USER_NAME="gituser" \
    -e GIT_USER_EMAIL="gituser@example.com" \
    -e GH_TOKEN="${GH_TOKEN:-}" \
    -v "oh_ws_${id}:/home/sandbox/harness" \
    -v claude-auth:/home/sandbox/.claude \
    -v gh-config:/home/sandbox/.config/gh \
    "$IMAGE" sleep infinity
}
```

Now watch the timing. Boot **A** first — this is the run that pulls the image if the host has never seen it:

```bash
time boot a
```

On a fresh host the pull dominates; on a host that already has the image, even this is a cache hit. Then boot **B** and **C** back to back:

```bash
time boot b
time boot c
```

B and C do **no** pull and **no** build — they reuse the exact image A already fetched. Each `time` line reads in the low single-digit seconds. That's the whole point: the expensive part happened once, and containers two and three ride the cache.

Confirm all three are up and that they're the same image:

```bash
docker ps --filter name=oh- --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

```
NAMES   IMAGE                                    STATUS
oh-c    ghcr.io/mifunedev/openharness:latest     Up 3 seconds
oh-b    ghcr.io/mifunedev/openharness:latest     Up 6 seconds
oh-a    ghcr.io/mifunedev/openharness:latest     Up 24 seconds
```

Same image ref on all three. One entry in `docker images`. Three isolated running sandboxes.

## They really are independent

The shared image is just the toolchain. The **workspace** — the `.oh/` control plane, the agent's identity, its memory, whatever repo it's working on — lives in each container's own volume. Prove it by writing a marker into one and checking it isn't in the others:

```bash
docker exec oh-a bash -lc 'echo "I am A" > /home/sandbox/harness/WHOAMI'
docker exec oh-b bash -lc 'cat /home/sandbox/harness/WHOAMI 2>&1'   # No such file — B is isolated
docker exec oh-a bash -lc 'cat /home/sandbox/harness/WHOAMI'        # I am A
```

Each is seeded once from the image on first boot (`OH_IMAGE_ONLY=1` switches the entrypoint into no-bind mode, seeds the baked `.oh/` into the empty volume, and writes an `.oh/.image-seeded` marker so later boots never re-clobber it). From then on the **volume is authoritative** — edits inside a running sandbox persist across restarts and image pulls, per container.

## Attach to whichever one you want

Each sandbox is a normal container, so attach the same way you would to a single one:

```bash
docker exec -it -u sandbox oh-a zsh     # drop into A
docker exec -it -u sandbox oh-b zsh     # …or B
```

Inside, start whichever agent you like — `claude`, `codex`, `pi`, or the opt-in `hermes` — and run `gh auth login && gh auth setup-git` once if you didn't pass a `GH_TOKEN`. Because the three share the `claude-auth` and `gh-config` volumes, credentials you set up in one are already there in the others.

Prefer VS Code? The Dev Containers extension's **Attach to Running Container** lists `oh-a`, `oh-b`, and `oh-c` side by side — pick one, and it forwards that container's ports to your laptop for the session. Open three VS Code windows and you're driving three agents at once. (See [Connecting → Option B](/docs/connecting#option-b--vscode-attach-to-running-container-local-host) for the details.)

## Tear down

Volumes outlive containers on purpose, so removing the containers doesn't touch the work:

```bash
docker rm -f oh-a oh-b oh-c
```

If you want a truly clean slate — including the seeded workspaces — drop the volumes too (**destructive**):

```bash
docker volume rm oh_ws_a oh_ws_b oh_ws_c
```

## Why this matters

The unit of Open Harness is one sandbox per repo — but nothing stops you from running a fleet of them on one host, and the cache makes the fleet nearly free. Fetch the image once; fan out as many isolated agents as the box has memory for. That's the shape of a lights-out software factory on a single VM: a row of named containers, each an agent on its own branch, all sharing one prebuilt image and nothing else.

Three lines. One image. Three agents.

For the full deployment reference — Flavor A (build/pull with your repo bind-mounted) vs. the image-only Flavor B used here, the compose one-liner, and the seed-to-volume mechanics — see [Prebuilt-image deployment](/docs/installation) and the deployment notes in the core repo.
