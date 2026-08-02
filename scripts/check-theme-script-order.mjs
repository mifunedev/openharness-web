#!/usr/bin/env node
/**
 * Ordering guard for the client-timezone default theme.
 *
 * The time-of-day correction (src/plugins/time-of-day-theme) is only correct if
 * its script runs AFTER Docusaurus's own color-mode script (which populates
 * `data-theme` / `data-theme-choice`) and BEFORE anything paints. This guard
 * asserts that against real `pnpm build` output.
 *
 * Version-resilience rules this guard follows:
 *
 *   1. Docusaurus's script is located by a STABLE CONTENT SIGNATURE — it is the
 *      inline script whose body mentions `data-theme-choice` — and ours by its
 *      own marker attribute. Byte offsets are NEVER pinned: they drifted ~100
 *      bytes between two builds with zero code changes.
 *
 *   2. Textual position only equals execution order for classic *synchronous*
 *      scripts. So the guard also asserts that neither script tag carries
 *      `defer`, `async`, or `type="module"`. Without this, a future Docusaurus
 *      release could defer its script and leave this guard green while the
 *      guarantee it exists to prove is silently broken.
 *
 * Usage:  node scripts/check-theme-script-order.mjs   (also runs as postbuild)
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_DIR = path.join(ROOT, "build");
const PLUGIN_SOURCE = path.join(ROOT, "src/plugins/time-of-day-theme/index.ts");

/**
 * Stable content signature for Docusaurus's color-mode script. This attribute
 * name is the observable contract the whole feature is built on — if Docusaurus
 * ever stops writing it, the feature is broken anyway and this guard should go
 * red rather than quietly pass.
 */
const DOCUSAURUS_SIGNATURE = "data-theme-choice";

/** Docusaurus's React root. Our script must run before it exists. */
const ROOT_ELEMENT = '<div id="__docusaurus"';

/**
 * Built pages to check: one entry per routing surface, in both the
 * `trailingSlash: false` and `trailingSlash: true` shapes. Missing candidates
 * are skipped; the run fails if none of them exist.
 */
const PAGES = [
  "index.html",
  "404.html",
  "docs.html",
  "docs/index.html",
  "blog.html",
  "blog/index.html",
];

const failures = [];

function fail(page, message) {
  failures.push(`${page}: ${message}`);
}

/**
 * Read the marker and the boundary hours straight from the plugin, so renaming
 * the marker or moving a boundary cannot silently rot the guard.
 */
async function readPluginContract() {
  const source = await readFile(PLUGIN_SOURCE, "utf8");
  const rel = path.relative(ROOT, PLUGIN_SOURCE);

  const read = (name, pattern) => {
    const match = source.match(pattern);
    if (!match) {
      throw new Error(`Could not read ${name} from ${rel}.`);
    }
    return match[1];
  };

  return {
    marker: read(
      "SCRIPT_MARKER_ATTRIBUTE",
      /SCRIPT_MARKER_ATTRIBUTE\s*=\s*["'`]([^"'`]+)["'`]/,
    ),
    dayStartHour: read("DAY_START_HOUR", /DAY_START_HOUR\s*=\s*(\d+)/),
    nightStartHour: read("NIGHT_START_HOUR", /NIGHT_START_HOUR\s*=\s*(\d+)/),
  };
}

/** Every <script> in document order, with its raw attribute string and body. */
function collectScripts(html) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    scripts.push({
      attrs: match[1],
      body: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return scripts;
}

/**
 * Attributes that break "textual position == execution order".
 * Returns the list of offending attribute names found.
 */
function nonBlockingAttributes(attrs) {
  const found = [];
  if (/(^|\s)defer(\s|=|$)/i.test(attrs)) found.push("defer");
  if (/(^|\s)async(\s|=|$)/i.test(attrs)) found.push("async");
  if (/(^|\s)type\s*=\s*["']?module\b/i.test(attrs)) found.push('type="module"');
  return found;
}

function checkPage(page, html, { marker, dayStartHour, nightStartHour }) {
  const scripts = collectScripts(html);

  const ours = scripts.filter((s) => s.attrs.includes(marker));
  const docusaurus = scripts.filter(
    (s) => s.body.includes(DOCUSAURUS_SIGNATURE) && !s.attrs.includes(marker),
  );

  if (docusaurus.length !== 1) {
    fail(
      page,
      `expected exactly 1 Docusaurus color-mode script (inline script whose body ` +
        `contains "${DOCUSAURUS_SIGNATURE}"), found ${docusaurus.length}. ` +
        `Docusaurus may have changed how it applies the color mode.`,
    );
  }
  if (ours.length !== 1) {
    fail(
      page,
      `expected exactly 1 time-of-day-theme script (tag carrying "${marker}"), ` +
        `found ${ours.length}.`,
    );
  }
  if (docusaurus.length !== 1 || ours.length !== 1) {
    return;
  }

  const dsc = docusaurus[0];
  const own = ours[0];

  // 1. Relative order — never byte offsets.
  if (!(dsc.start < own.start)) {
    fail(
      page,
      `time-of-day-theme script must come AFTER Docusaurus's color-mode script, ` +
        `but it comes before it. Our correction would be overwritten.`,
    );
  }

  // 2. Nothing paints in between: we must still be ahead of the React root.
  const rootIndex = html.indexOf(ROOT_ELEMENT);
  if (rootIndex === -1) {
    fail(page, `could not find the React root (${ROOT_ELEMENT}).`);
  } else if (!(own.end <= rootIndex)) {
    fail(
      page,
      `time-of-day-theme script must come BEFORE ${ROOT_ELEMENT}, but it comes after it — ` +
        `the wrong theme could paint first.`,
    );
  }

  // 3. Textual order only implies execution order for classic sync scripts.
  for (const [label, script] of [
    ["Docusaurus color-mode", dsc],
    ["time-of-day-theme", own],
  ]) {
    const offenders = nonBlockingAttributes(script.attrs);
    if (offenders.length > 0) {
      fail(
        page,
        `the ${label} script tag carries ${offenders.join(", ")} — it no longer executes ` +
          `in document order, so the position check above proves nothing.`,
      );
    }
  }

  // 4. The shipped bytes must still encode the boundaries the source declares.
  //    Guards against the constants and the emitted script drifting apart.
  const boundaries = [
    [`>= ${nightStartHour}`, new RegExp(`>=\\s*${nightStartHour}\\b`)],
    [`< ${dayStartHour}`, new RegExp(`<\\s*${dayStartHour}\\b`)],
  ];
  for (const [label, pattern] of boundaries) {
    if (!pattern.test(own.body)) {
      fail(
        page,
        `the shipped time-of-day-theme script does not test "hour ${label}", but the plugin ` +
          `source declares that boundary. Source constants and emitted script have drifted.`,
      );
    }
  }
}

async function main() {
  if (!existsSync(BUILD_DIR)) {
    console.error(
      `[theme-order] no build output at ${path.relative(ROOT, BUILD_DIR)}/ — run \`pnpm build\` first.`,
    );
    process.exit(2);
  }

  const contract = await readPluginContract();
  let checked = 0;

  for (const page of PAGES) {
    const file = path.join(BUILD_DIR, page);
    if (!existsSync(file)) {
      continue;
    }
    checkPage(page, await readFile(file, "utf8"), contract);
    checked += 1;
  }

  if (checked === 0) {
    console.error(
      `[theme-order] none of the expected pages exist under build/: ${PAGES.join(", ")}`,
    );
    process.exit(2);
  }

  if (failures.length > 0) {
    console.error(`[theme-order] FAIL (${checked} page(s) checked)`);
    for (const failure of failures) {
      console.error(`  x ${failure}`);
    }
    process.exit(1);
  }

  console.log(
    `[theme-order] PASS — ${checked} page(s): Docusaurus color-mode script -> ` +
      `time-of-day-theme script (marker "${contract.marker}") -> ${ROOT_ELEMENT}, ` +
      `both classic and synchronous; boundaries ` +
      `>=${contract.nightStartHour}/<${contract.dayStartHour} present in shipped script.`,
  );
}

main().catch((error) => {
  console.error(`[theme-order] ERROR: ${error.message}`);
  process.exit(2);
});
