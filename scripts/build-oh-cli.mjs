// Build the standalone `oh` CLI bundle (oh.js) from the canonical openharness
// repo and place it at static/oh.js, so GitHub Pages serves it at
// https://oh.mifune.dev/oh.js. `get-oh.sh` downloads this prebuilt bundle
// instead of building on the host.
//
// Runs as part of the `prebuild` hook. A failure to produce a fresh bundle FAILS
// the build. `oh` is the only door into Open Harness: a silently skipped build
// means every `curl … | bash` install keeps getting the previous bundle, which is
// how the published CLI fell weeks behind its own documentation. Only genuinely
// transient network failures warn and keep the previously published artifact.
import { execSync } from "node:child_process";
import {
  mkdtempSync, rmSync, copyFileSync, existsSync, readFileSync, mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { REPO, REF, MirrorError, reportAndExit, resolveSha } from "./oh-source.mjs";

const TAG = "build-oh-cli";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = join(ROOT, "static", "oh.js");

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: "inherit" });
const capture = (cmd, cwd) => execSync(cmd, { cwd, encoding: "utf8" }).trim();

let work;
try {
  // Resolving the ref first separates "GitHub is unreachable" from "that ref does
  // not exist", which a bare `git clone` failure conflates.
  const sha = await resolveSha();
  console.log(`[${TAG}] source ${REPO}@${REF} (${sha})`);

  work = mkdtempSync(join(tmpdir(), "oh-cli-build-"));
  run(`git clone --depth 1 --branch ${REF} https://github.com/${REPO}.git src`, work);
  const src = join(work, "src");
  const cloned = capture("git rev-parse HEAD", src);
  if (cloned !== sha) console.warn(`[${TAG}] ref moved during build: resolved ${sha}, cloned ${cloned}`);

  const cli = join(src, ".oh", "cli");
  if (!existsSync(join(cli, "package.json"))) throw new MirrorError(`.oh/cli not found in ${REPO}@${REF}`);
  run("npm install --no-audit --no-fund", cli);
  run("npm run build", cli);
  const built = join(cli, "dist", "oh.js");
  if (!existsSync(built)) throw new MirrorError("build did not produce dist/oh.js");
  if (!readFileSync(built, "utf8").startsWith("#!")) throw new MirrorError("built oh.js has no shebang");
  mkdirSync(dirname(DEST), { recursive: true });
  copyFileSync(built, DEST);
  console.log(`[${TAG}] wrote static/oh.js <- ${REPO}@${REF} (${cloned}, .oh/cli)`);
} catch (err) {
  reportAndExit(TAG, err, [DEST]);
} finally {
  if (work) rmSync(work, { recursive: true, force: true });
}
