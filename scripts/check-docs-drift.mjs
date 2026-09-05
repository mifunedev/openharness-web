// Fails when authored content describes behaviour the harness has retired.
//
// The site keeps a hand-copied duplicate of the harness repo's docs/ and there is
// no sync for prose, so the one-door migration sat undetected here for weeks while
// oh.mifune.dev told new readers to run `make`. Closing that once without a
// detector guarantees it reopens.
//
// promos/ is scanned for the same reason and was missed the first time: its banner
// recipes are the source the social cards are rendered from, so a retired command
// left there reappears the next time a card is generated.
//
// src/pages/ is scanned because the homepage hero is a copy-pasteable quickstart
// that no docs page owns, and it kept teaching a flow the CLI had already dropped.
//
// blog/ is not scanned. Those posts are dated records of how the harness worked
// at the time, and the site's policy is an admonition rather than an edit.
//
// That policy has a known limit, hit by the single-home-mount migration: an
// admonition reading "these commands no longer apply" still leaves a reader
// copy-pasting a deployment recipe that silently loses their state, and one
// post's central claim (shared logins, separate workspaces) had become
// impossible rather than merely dated. Those two posts therefore carry
// corrected commands as well as their admonition.
//
// Turning the scan on for blog/ would make that the site-wide rule. It is a
// one-word change here, and it currently reports 12 pre-existing hits in the
// two Makefile-era posts. That is an editorial decision, not a mechanical one.
//
// ── Adding to RETIRED is how the next migration protects itself. ──
// When you remove a command, a file, or a configuration knob from the harness,
// add its name here in the same change. The cost is one line; the thing it buys
// is that the site cannot quietly keep recommending it.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import process from "node:process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCANNED = ["docs", "promos", "src/pages"];

const RETIRED = [
  {
    // The Makefile is gone; `oh` is the only lifecycle door.
    pattern: /\bmake\s+(sandbox|shell|destroy|ps|stop|restart|logs|config|gateway|help|harness-config)\b/g,
    name: "make <verb>",
    instead: "the equivalent `oh` verb — see docs/lifecycle-commands.md",
  },
  {
    // Config split into a tracked oh.json and a secrets-only root .env.
    pattern: /\.example\.env\b|\bexample\.env\b/g,
    name: ".example.env",
    instead: "`oh.json` for non-secrets and root `.env.example` for secret names",
  },
  {
    // The directory layout is fixed convention, not configuration.
    pattern: /\b(WORKTREES_DIR|PROJECTS_DIR|CRONS_DIR)\b/g,
    name: "a retired layout knob",
    instead: "the fixed layout: .worktrees/, projects/, crons/ at the repo root",
  },
  {
    // False since the oh CLI shipped.
    pattern: /no host CLI/gi,
    name: '"no host CLI"',
    instead: "the truth: `oh` is a host CLI and the only lifecycle door",
  },
  {
    // Retired in favour of oh.json + a secrets-only dotenv.
    pattern: /\bharness\.yaml\b/g,
    name: "harness.yaml",
    instead: "`oh.json`",
  },
  {
    // The per-tool named volumes collapsed into one mount at /home/sandbox.
    pattern: /\b(claude-auth|codex-auth|pi-auth|opencode-auth|grok-auth|deepagents-auth|herdr-data|cloudflared-auth)\b/g,
    name: "a retired per-tool volume",
    instead: "the single `/home/sandbox` mount — see docs/installation.md",
  },
  {
    // The separate workspace volume is part of the same single home mount.
    pattern: /\boh_workspace\b/g,
    name: "oh_workspace",
    instead: "the single `/home/sandbox` mount, managed as `<sandbox-name>_workspace` unless `storage.homePath` binds it",
  },
  {
    // The checkout is fixed at /home/sandbox/harness; the knob is gone.
    pattern: /\bprojectRoot\b|\bOH_PROJECT_ROOT\b/g,
    name: "projectRoot / OH_PROJECT_ROOT",
    instead: "the fixed checkout path `/home/sandbox/harness`",
  },
  {
    // `oh init` is gone; a checkout is equipped by `oh update`, a sandbox by the wizard.
    pattern: /\boh init\b|\bopenharness init\b/g,
    name: "oh init",
    instead: "`oh update` to equip a checkout with .oh/ + crons/, or `oh sandbox install docker` to create a sandbox",
  },
  {
    // The `oh runtime` namespace collapsed into `oh sandbox` and `oh tool install`.
    pattern: /\boh runtime\b/g,
    name: "oh runtime",
    instead: "`oh sandbox --help` (catalog), `oh sandbox install docker` (provision), `oh tool install microsandbox` (msb)",
  },
  {
    // A bare `oh sandbox` no longer provisions anything; it prints help and exits non-zero.
    pattern: /\boh sandbox\b(?!\s+(?:install|list)\b|\s+--help\b|\s+<)/g,
    name: "bare `oh sandbox`",
    instead: "`oh sandbox install docker [--name <name>] [--repo <dir>]`, or `oh sandbox list`",
  },
  {
    // Installs are no longer persisted or skipped by flag; there is one door.
    pattern: /--persist-only\b|--no-persist\b/g,
    name: "--persist-only / --no-persist",
    instead: "plain `oh harness install <id>` / `oh tool install <id>` — oh.json carries no install field",
  },
  {
    // oh.json lost its install block when nothing installs at boot.
    pattern: /\binstall\.(?:\*|(?:opencode|grokBuild|grok_build|deepagents|hermes|agentBrowser)\b)|"install"\s*:/g,
    name: "an install.* key",
    instead: "`oh harness install <id>` or `oh tool install <id>`; oh.json holds no install field",
  },
  {
    // The image no longer bakes harnesses in, so the build flags that selected them are gone.
    pattern: /\bINSTALL_(?:OPENCODE|GROK_BUILD|DEEPAGENTS|HERMES|AGENT_BROWSER)\b/g,
    name: "an INSTALL_* build flag",
    instead: "`oh harness install <id>` / `oh tool install <id>` into the running sandbox",
  },
  {
    // The Hermes dashboard moved from env flags to oh.json keys.
    pattern: /\bHERMES_DASHBOARD(?:_PORT)?=/g,
    name: "a HERMES_DASHBOARD env flag",
    instead: "`oh config set hermesDashboard.enabled true` and `hermesDashboard.port` — see docs/harnesses/hermes.md",
  },
  {
    // systemd is PID 1; the tmux supervisor and the tmux-wrapped scheduler are gone.
    // Anchored so the per-fire session convention cron-<id>-<MMDD>-<HHMM> — which is
    // unchanged and still tmux — is not caught by a naive /cron-/ match.
    pattern: /\bcron-watchdog\b|\bcron-system\b(?!-)|\bsystem-cron\b|\bCRON_WATCHDOG_INTERVAL\b|\/tmp\/cron-watchdog[.\w]*|\brestart-openharness-tmux\.sh\b/g,
    name: "the retired tmux cron supervision",
    instead:
      "`openharness-cron.service` under systemd — `systemctl reload|restart|status openharness-cron.service`; per-fire `tmux: true` sessions are unchanged",
  },
  {
    // The container lifecycle is systemd, not a sleeping process under Tini.
    pattern: /\bsleep infinity\b|^\s*init:\s*true\b|--init\b|\bentrypoint:\s*\/usr\/local\/bin\/entrypoint\.sh/gm,
    name: "the pre-systemd container lifecycle",
    instead:
      "the image's own `CMD [\"/sbin/init\"]` plus `--cgroupns private --cap-add SYS_ADMIN --security-opt apparmor=unconfined --tmpfs /run --tmpfs /run/lock --tmpfs /sys/fs` — see docs/docker-deployment.md",
  },
  {
    // gvisor was never in the runtime catalog that shipped.
    pattern: /\bgvisor\b|\brunsc\b/gi,
    name: "gvisor",
    instead: "the catalog is docker (provisionable) and microsandbox (planned) — see docs/runtimes/overview.md",
  },
  {
    // The two install flavours became one wizard with an optional --repo.
    pattern: /\bFlavor [AB]\b/g,
    name: "Flavor A/B",
    instead: "`oh sandbox install docker` (published image) versus `--repo <dir>` (bind-mounted checkout)",
  },
  {
    // Nothing ships in the image any more, so nothing is preinstalled.
    pattern: /\bpre-?installed\b|\binstalled by default\b/gi,
    name: '"preinstalled"',
    instead: "nothing installs at boot; `oh harness install <id>` / `oh tool install <id>` are the only door",
  },
  {
    // The checkout path is fixed at /home/sandbox/harness.
    pattern: /\/home\/sandbox\/project\b/g,
    name: "/home/sandbox/project",
    instead: "the fixed checkout path `/home/sandbox/harness`",
  },
];

// A page may name a retired thing in order to say it is retired. Each exemption
// is per file AND per token, and carries the reason it is allowed to stay.
const ALLOW = [
  {
    file: "harnesses/muse-code.md",
    token: "the pre-systemd container lifecycle",
    why: "--init is the supported provider-link repair flag, not the retired Docker init flag",
  },
  {
    file: "configuration.md",
    token: "a retired layout knob",
    why: "documents that these knobs were removed and the layout is now fixed",
  },
  {
    file: "quickstart.md",
    token: "harness.yaml",
    why: "explains the retired layer and that a leftover file is migrated automatically",
  },
  {
    file: "installation.md",
    token: "a retired per-tool volume",
    why: "names the old volumes in the manual migration recipe, to say they are gone and not migrated automatically",
  },
  {
    file: "runtimes/microsandbox.md",
    token: "the pre-systemd container lifecycle",
    why: "names the retired keys in the compose-to-msb translation table, to say they are gone",
  },
  {
    file: "docker-deployment.md",
    token: "the pre-systemd container lifecycle",
    why: "names --init to explain why the systemd recipe no longer carries it",
  },
  {
    file: "lifecycle-commands.md",
    token: "bare `oh sandbox`",
    why: "documents that a bare `oh sandbox` prints help and exits non-zero",
  },
  {
    file: "runtimes/overview.md",
    token: "bare `oh sandbox`",
    why: "names the namespace the runtime catalog lives under",
  },
];

const SCANNED_EXTENSIONS = [".md", ".json", ".tsx"];

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return SCANNED_EXTENSIONS.some((ext) => full.endsWith(ext)) ? [full] : [];
  });
}

function scanned() {
  return SCANNED.flatMap((name) => walk(join(ROOT, name)).map((path) => ({ path, rel: relative(ROOT, path) })));
}

const allowed = (file, token) =>
  ALLOW.some((a) => (file === a.file || file.endsWith("/" + a.file)) && a.token === token);

const pages = scanned();
const violations = [];
for (const { path, rel } of pages) {
  const lines = readFileSync(path, "utf8").split("\n");
  for (const { pattern, name, instead } of RETIRED) {
    if (allowed(rel, name)) continue;
    lines.forEach((line, i) => {
      pattern.lastIndex = 0;
      const hit = pattern.exec(line);
      if (hit) violations.push({ file: rel, line: i + 1, name, match: hit[0], instead, text: line.trim() });
    });
  }
}

if (violations.length > 0) {
  console.error(`[docs-drift] ${violations.length} retired reference(s) in ${SCANNED.map((d) => `${d}/`).join(", ")}:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} — ${v.name}: "${v.match}"`);
    console.error(`    ${v.text.length > 100 ? v.text.slice(0, 100) + "…" : v.text}`);
    console.error(`    use instead: ${v.instead}\n`);
  }
  console.error("[docs-drift] The harness retired these. A page that still recommends one");
  console.error("[docs-drift] tells a new reader to run something that no longer exists.");
  console.error("[docs-drift] If a page names one in order to say it is retired, add a");
  console.error("[docs-drift] per-file, per-token entry to ALLOW in scripts/check-docs-drift.mjs.");
  process.exit(1);
}

console.log(`[docs-drift] PASS — ${pages.length} file(s) under ${SCANNED.map((d) => `${d}/`).join(", ")}, no retired references`);
