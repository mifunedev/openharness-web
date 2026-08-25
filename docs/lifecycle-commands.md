---
sidebar_position: 5
title: "Lifecycle commands: make vs oh"
---

# Lifecycle commands: `make` vs `oh`

There are two front doors to the sandbox lifecycle. This page is the single
source of truth for which is which. Every other page links here rather than
restating the table.

**They are not two implementations.** Every compose command — from either door —
runs the same vendored script. `make sandbox` calls it directly; `oh sandbox`
reaches it through the Docker Compose execution target. That script owns overlay
resolution, project naming, and env plumbing. Nothing is duplicated except the
name you type.

## Which one is canonical

It depends on where you are, not on preference.

| Where | Canonical | Why |
|---|---|---|
| **On the host, in a source checkout** | `make` | Host prerequisites are Docker, Git, and `make` — deliberately **no Node**. The host `oh` CLI needs Node ≥ 20, so `make` is the one that always works. |
| **Inside the sandbox** | `oh` | `oh` is baked into the image at `/usr/local/bin/oh`. |
| **In a repo equipped by `oh init`** | `oh` | An equipped repo gets the `.oh/` control plane and no Makefile. `oh` is the only door. |

This is why neither surface delegates to the other: making the Makefile call
`oh` would add Node to the host prerequisites and break the headline promise.

## The mapping

| `make` | `oh` | Runs |
|---|---|---|
| `make sandbox` | `oh sandbox` | `up -d --build` |
| `make shell [container]` | `oh shell [container]` | an interactive `zsh` in the container |
| `make stop` | `oh stop` | `stop` |
| `make restart` | `oh restart` | `restart` |
| `make logs` | `oh logs` | `logs -f` |
| `make ps` | `oh ps` | `ps` |
| `make gateway <pi\|hermes>` | `oh gateway <args…>` | the gateway script |
| `make destroy` | — | see below |
| `make config` | — | see below |
| `make harness-config` | *(implicit in `oh sandbox`)* | seeds `harness.yaml` from the example |
| — | `oh init` · `oh update` · `oh harness` · `oh runtime` · `oh tool` · `oh cloud` · `oh config <integration>` | no `make` equivalent, by design |

`oh <verb> -- <args>` forwards extra arguments to `docker compose`, for example
`oh logs -- --tail 50`.

## The three deliberate exceptions

### `make destroy` — there is no `oh destroy`

`down -v` wipes the named volumes, which hold your provider authentication. A
passthrough with no confirmation policy would put that one typo away. The verb is
deferred until that policy is designed, not forgotten. Use `make destroy` on the
host, and prefer `make stop` when you want credentials to survive.

### `make config` — no `oh` equivalent

`oh config` already means *"configure an integration"* (`oh config <name>`).
Overloading it to also print resolved compose config would be worse than the gap.
A different verb name may resolve this later.

### `make shell` — a deliberate raw `docker exec`

`oh shell` routes through the execution target; the Makefile spawns
`docker exec` directly. That is intentional and pinned. The Makefile is host-side
orchestration, not work executed inside a provisioned environment, so it sits
outside that seam — the same reasoning that keeps `oh gateway` off it. See the
[brain/hands boundary RFC](https://github.com/mifunedev/openharness/blob/main/.oh/docs/rfcs/rfc-brain-hands-boundary.md).

## What is not consolidated, and why

`make harness-config` and the CLI both seed `harness.yaml` by copying the
example. Unifying them means the Makefile shelling into Node, which the
host-prerequisite promise forbids. Two small implementations of one `cp` is the
cheaper trade.
