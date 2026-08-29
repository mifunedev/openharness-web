# Open Harness Web

Docusaurus documentation site for [Open Harness](https://github.com/mifunedev/openharness), published at <https://oh.mifune.dev>.

## Develop

```bash
pnpm install
pnpm start
pnpm build
```

## Content

- `docs/` — product and operator documentation mirrored from the Open Harness repo at extraction time.
- `blog/` — long-form Open Harness posts.
- `src/` + `static/` — Docusaurus theme, landing page, and assets.

The Open Harness core repo now keeps concise GitHub-readable markdown and points readers here/DeepWiki for the rendered site experience.

## The script mirror

Three paths under the site root serve executable content that users pipe into a
shell. Two of them are built here; one is not, and that asymmetry is the thing to
know before changing any of it.

| URL | Served by | Source |
| --- | --- | --- |
| `/get-oh.sh` | `scripts/sync-external-scripts.mjs` → `static/get-oh.sh` | `.oh/scripts/get-oh.sh` in the harness repo |
| `/oh.js` | `scripts/build-oh-cli.mjs` → `static/oh.js` | built from `.oh/cli` in the harness repo |
| `/install.sh` | **an HTTP 302 configured at the CDN, outside this repo** | `.oh/scripts/install.sh` on `main`, via `raw.githubusercontent.com` |

Both build scripts resolve their upstream ref through `scripts/oh-source.mjs`, which
is the single place the ref is decided. It defaults to **`main`** — the release ref.
`development` carries unreleased CLI behaviour and must not be published to people
running `curl … | bash`.

Both artifacts are gitignored. They exist only as build output, so the deployed site
is always as fresh as its last successful build.

**A failed mirror fails the build.** A missing file, a ref that does not resolve, a
body without a shebang, or a CLI build error all exit non-zero rather than deploying.
Only a genuinely transient network failure (DNS, TCP, 5xx, rate limit) warns and
keeps the previously published artifact — and even that is fatal when no previous
artifact exists. This is deliberate: `oh` is the only door into Open Harness, and a
silently skipped build is how the published CLI fell weeks behind its own docs.

**The `/install.sh` redirect is not managed here.** GitHub Pages cannot issue a 302,
so the rule lives at the CDN/DNS layer in front of `static/CNAME`. It is pinned to
`main` with no override, and it bypasses the shebang check the other two get. Do not
add `install.sh` to `SCRIPTS[]` while the redirect exists — the redirect would shadow
the static file and two mechanisms would serve one path. Removing the CDN rule and
mirroring it properly needs whoever owns that layer.

### Refreshing the mirror

The site rebuilds on push to `main`, on a daily schedule, on manual
`workflow_dispatch` (which takes a `ref` input), and on a `repository_dispatch` of
type `openharness-release`:

```bash
gh api repos/mifunedev/openharness-web/dispatches \
  -f event_type=openharness-release \
  -F 'client_payload[ref]=main'
```

Sending that dispatch from the harness repo's release workflow is a follow-up on the
harness side, not part of this repo.
