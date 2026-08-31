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
// blog/ is deliberately not scanned. Those posts are dated records of how the
// harness worked at the time; they carry an admonition instead of an edit.
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
const SCANNED = ["docs", "promos"];

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
];

// A page may name a retired thing in order to say it is retired. Each exemption
// is per file AND per token, and carries the reason it is allowed to stay.
const ALLOW = [
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
    file: "configuration.md",
    token: "projectRoot / OH_PROJECT_ROOT",
    why: "documents that the knob was removed and the checkout path is now fixed",
  },
];

const SCANNED_EXTENSIONS = [".md", ".json"];

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
