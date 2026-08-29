// Build-time sync of shipped install scripts from the canonical openharness repo
// into static/, so GitHub Pages serves them at the site root (e.g.
// https://oh.mifune.dev/get-oh.sh) without a copy that can drift.
//
// Runs as the `prebuild` hook. A missing file, a 404, or a body that is not a
// script FAILS the build: `oh` is the only door into Open Harness, so publishing
// a site whose bootstrap script is stale or absent is worse than not deploying.
// Only genuinely transient network failures warn and keep the previous artifact.
//
// NOTE — install.sh is deliberately absent from SCRIPTS[]. It is currently served
// by a 302 configured at the CDN layer in front of static/CNAME, pointing at
// raw.githubusercontent.com/mifunedev/openharness/refs/heads/main/.oh/scripts/install.sh.
// That rule lives outside this repo, so adding install.sh here would write a
// static/install.sh that the redirect shadows — two mechanisms serving one path.
// Removing the CDN rule is tracked as a follow-up; do not mirror it until then.
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import {
  RAW_BASE, REF, REPO, MirrorError, classifyFetchError, isTransientStatus, reportAndExit, resolveSha,
} from "./oh-source.mjs";

const TAG = "sync-scripts";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// path in the openharness repo -> path under static/ (served at site root)
const SCRIPTS = [
  { src: ".oh/scripts/get-oh.sh", dest: "static/get-oh.sh" },
];

async function syncOne({ src, dest }) {
  const url = `${RAW_BASE}/${src}`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw classifyFetchError(err);
  }
  const body = await res.text();
  if (!res.ok) {
    const detail = `${url} -> HTTP ${res.status}`;
    if (isTransientStatus(res.status)) {
      throw new MirrorError(`could not fetch ${dest} (${detail})`, { transient: true });
    }
    throw new MirrorError(`${dest} is not present at ${REPO}@${REF} (${detail})`);
  }
  if (!body.startsWith("#!")) {
    throw new MirrorError(`${url} did not return a script (no shebang)`);
  }
  const out = join(ROOT, dest);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, body, { mode: 0o644 });
  console.log(`[${TAG}] wrote ${dest} <- ${url} (${body.length} bytes)`);
}

try {
  const sha = await resolveSha();
  console.log(`[${TAG}] source ${REPO}@${REF} (${sha})`);
  for (const script of SCRIPTS) await syncOne(script);
} catch (err) {
  reportAndExit(TAG, err, SCRIPTS.map((s) => join(ROOT, s.dest)));
}
