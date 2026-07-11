// Build-time sync of shipped install scripts from the canonical openharness repo
// into static/, so GitHub Pages serves them at the site root (e.g.
// https://oh.mifune.dev/get-oh.sh) without a copy that can drift.
//
// Runs as the `prebuild` hook. Non-fatal by design: if a source isn't on `main`
// yet (e.g. a just-opened PR) or GitHub is briefly unreachable, we WARN and skip
// so a docs deploy never breaks on it. Once the script lands on main, the next
// deploy picks it up.
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPostHogClient, BUILD_DISTINCT_ID } from "./posthog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REF = process.env.OH_SCRIPTS_REF || "refs/heads/main";
const REPO = process.env.OH_GITHUB_REPO || "mifunedev/openharness";
const BASE = `https://raw.githubusercontent.com/${REPO}/${REF}`;

// path in the openharness repo -> path under static/ (served at site root)
const SCRIPTS = [
  { src: ".oh/scripts/get-oh.sh", dest: "static/get-oh.sh" },
];

const posthog = createPostHogClient();

async function syncOne({ src, dest }) {
  const url = `${BASE}/${src}`;
  try {
    const res = await fetch(url);
    const body = await res.text();
    if (!res.ok) {
      console.warn(`[sync-scripts] skip ${dest}: ${url} -> HTTP ${res.status} (not on ${REF} yet?)`);
      posthog?.capture({ distinctId: BUILD_DISTINCT_ID, event: 'script sync skipped', properties: { dest, url, status: res.status, reason: 'http_error' } });
      return;
    }
    if (!body.startsWith("#!")) {
      console.warn(`[sync-scripts] skip ${dest}: ${url} did not return a script (no shebang)`);
      posthog?.capture({ distinctId: BUILD_DISTINCT_ID, event: 'script sync skipped', properties: { dest, url, reason: 'no_shebang' } });
      return;
    }
    const out = join(ROOT, dest);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, body, { mode: 0o644 });
    console.log(`[sync-scripts] wrote ${dest} <- ${url} (${body.length} bytes)`);
    posthog?.capture({ distinctId: BUILD_DISTINCT_ID, event: 'script synced', properties: { dest, url, bytes: body.length } });
  } catch (err) {
    console.warn(`[sync-scripts] skip ${dest}: ${err.message}`);
    posthog?.capture({ distinctId: BUILD_DISTINCT_ID, event: 'script sync skipped', properties: { dest, url, reason: 'exception', error: err.message } });
  }
}

await Promise.all(SCRIPTS.map(syncOne));
await posthog?.shutdown();
