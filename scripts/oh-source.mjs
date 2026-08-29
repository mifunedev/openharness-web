// Shared resolution of the upstream openharness ref that the site mirrors.
//
// Both mirror scripts (sync-external-scripts.mjs, build-oh-cli.mjs) must agree on
// exactly one ref. They previously disagreed: one defaulted to "refs/heads/main"
// and the other to "main", so an operator setting OH_SCRIPTS_REF in one form got
// a working sync and a silently skipped CLI build, or the reverse.
//
// The default is `main`, the release ref. `development` carries unreleased CLI
// behaviour; the site must not serve a bundle strangers `curl | bash` from a
// branch that has not been promoted.
import { existsSync } from "node:fs";
import process from "node:process";

export const REPO = process.env.OH_GITHUB_REPO || "mifunedev/openharness";
export const REF = (process.env.OH_SCRIPTS_REF || "main").replace(/^refs\/heads\//, "");
export const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${REF}`;

// REF and REPO reach `git clone` as command arguments. Reject anything that is not
// a plausible ref/slug, and anything leading with `-`, which git would read as a flag.
const SAFE = /^[A-Za-z0-9][A-Za-z0-9._\/-]*$/;
for (const [name, value] of [["OH_GITHUB_REPO", REPO], ["OH_SCRIPTS_REF", REF]]) {
  if (!SAFE.test(value)) {
    console.error(`[oh-source] FATAL: ${name}=${JSON.stringify(value)} is not a valid ref or repo slug.`);
    process.exit(1);
  }
}

export class MirrorError extends Error {
  constructor(message, { transient = false } = {}) {
    super(message);
    this.name = "MirrorError";
    this.transient = transient;
  }
}

// A transient failure is one where the upstream content is presumably fine and we
// simply could not reach it: DNS, TCP, TLS, 5xx, or a rate limit. Everything else
// — a missing ref, a 404, a file that is not a script, a failed build — means the
// mirror would publish something wrong, and must fail the deploy instead.
export function isTransientStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

export function classifyFetchError(err) {
  return new MirrorError(err.message, { transient: true });
}

function authHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return token ? { authorization: `Bearer ${token}` } : {};
}

// Resolves REF to a commit SHA. Doubles as the existence check for the ref, so a
// typo or an unpromoted branch fails here with a clear message rather than deep
// inside a `git clone`.
export async function resolveSha() {
  const url = `https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(REF)}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { accept: "application/vnd.github.sha", ...authHeaders() },
    });
  } catch (err) {
    throw classifyFetchError(err);
  }
  if (!res.ok) {
    const detail = `${url} -> HTTP ${res.status}`;
    if (isTransientStatus(res.status)) {
      throw new MirrorError(`could not reach GitHub (${detail})`, { transient: true });
    }
    throw new MirrorError(`ref ${REPO}@${REF} does not resolve (${detail})`);
  }
  return (await res.text()).trim();
}

// A transient failure is survivable only when there is already a good artifact to
// keep. In CI the mirrored files are gitignored and therefore absent on a fresh
// checkout, so "warn and continue" there would deploy a site missing them entirely.
export function reportAndExit(tag, err, artifacts = []) {
  if (err instanceof MirrorError && err.transient) {
    const missing = artifacts.filter((path) => !existsSync(path));
    if (missing.length === 0) {
      console.warn(`[${tag}] transient: ${err.message} — keeping the previously published artifact`);
      return;
    }
    console.error(`[${tag}] FATAL: ${err.message}`);
    console.error(`[${tag}] the failure looks transient, but there is no previous artifact to fall back on: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.error(`[${tag}] FATAL: ${err.message}`);
  console.error(`[${tag}] refusing to deploy a site whose mirrored artifacts are stale or wrong.`);
  process.exit(1);
}
