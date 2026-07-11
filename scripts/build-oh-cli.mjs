// Build the standalone `oh` CLI bundle (oh.js) from the canonical openharness
// repo and place it at static/oh.js, so GitHub Pages serves it at
// https://oh.mifune.dev/oh.js. `get-oh.sh` downloads this prebuilt bundle
// instead of building on the host.
//
// Runs as part of the `prebuild` hook. Non-fatal by design: on ANY failure
// (network, missing ref, build error) it WARNs and skips so a docs deploy never
// breaks — the previous static/oh.js (if present) simply isn't refreshed.
import { execSync } from "node:child_process";
import {
  mkdtempSync, rmSync, copyFileSync, existsSync, readFileSync, mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createPostHogClient, BUILD_DISTINCT_ID } from "./posthog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = process.env.OH_GITHUB_REPO || "mifunedev/openharness";
// Accept a bare branch/tag or a `refs/heads/...` form (the sync script uses the latter).
const REF = (process.env.OH_SCRIPTS_REF || "main").replace(/^refs\/heads\//, "");
const DEST = join(ROOT, "static", "oh.js");

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });

const posthog = createPostHogClient();
const work = mkdtempSync(join(tmpdir(), "oh-cli-build-"));
try {
  run(`git clone --depth 1 --branch ${REF} https://github.com/${REPO}.git src`, work);
  const cli = join(work, "src", ".oh", "cli");
  if (!existsSync(join(cli, "package.json"))) throw new Error(`.oh/cli not found in ${REPO}@${REF}`);
  run("npm install --no-audit --no-fund", cli);
  run("npm run build", cli);
  const built = join(cli, "dist", "oh.js");
  if (!existsSync(built)) throw new Error("build did not produce dist/oh.js");
  if (!readFileSync(built, "utf8").startsWith("#!")) throw new Error("built oh.js has no shebang");
  mkdirSync(dirname(DEST), { recursive: true });
  copyFileSync(built, DEST);
  console.log(`[build-oh-cli] wrote static/oh.js <- ${REPO}@${REF} (.oh/cli)`);
  posthog?.capture({ distinctId: BUILD_DISTINCT_ID, event: 'cli build completed', properties: { repo: REPO, ref: REF } });
} catch (err) {
  console.warn(`[build-oh-cli] skip static/oh.js: ${err.message}`);
  posthog?.capture({ distinctId: BUILD_DISTINCT_ID, event: 'cli build failed', properties: { repo: REPO, ref: REF, error: err.message } });
} finally {
  rmSync(work, { recursive: true, force: true });
  await posthog?.shutdown();
}
