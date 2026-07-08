#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const cwd = process.cwd();
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const recipeArg = args[0];
if (!recipeArg) {
  console.error("Usage: node scripts/render-blog-banner.mjs <recipe.json>");
  process.exit(1);
}

const recipePath = path.resolve(cwd, recipeArg);
const recipe = JSON.parse(await fs.readFile(recipePath, "utf8"));

if (recipe.version !== 1) {
  throw new Error(`Unsupported banner recipe version: ${recipe.version}`);
}

const width = recipe.dimensions?.width ?? 1200;
const height = recipe.dimensions?.height ?? 675;
const theme = {
  bg0: recipe.theme?.bg0 ?? "#000000",
  bg1: recipe.theme?.bg1 ?? "#0a0a0a",
  surface: recipe.theme?.surface ?? "#0a0a0a",
  border: recipe.theme?.border ?? "#1f1f1f",
  accent: recipe.theme?.accent ?? "#4ade80",
  accent2: recipe.theme?.accent2 ?? "#86efac",
  amber: recipe.theme?.amber ?? "#d97706",
  red: recipe.theme?.red ?? "#dc2626",
  text: recipe.theme?.text ?? "#ffffff",
  muted: recipe.theme?.muted ?? "#888888",
  code: recipe.theme?.code ?? "#e5e5e5",
};

const safe = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const rel = (target) => path.relative(cwd, target);
const tspans = (textLines, x, firstDy, dy) => textLines
  .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? firstDy : dy}">${safe(line)}</tspan>`)
  .join("\n");

async function loadImageData(media, fallbackSlot) {
  if (!media?.source) return null;
  const sourceImage = path.resolve(path.dirname(recipePath), media.source);
  const slot = media.slot ?? fallbackSlot;
  const imageBuffer = await sharp(sourceImage)
    .resize(slot.width, slot.height, {
      fit: media.fit ?? "cover",
      position: media.position ?? "center",
    })
    .jpeg({ quality: 92 })
    .toBuffer();
  return {
    slot,
    data: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
  };
}

async function renderProofPathCard() {
  const image = await loadImageData(recipe.media, { left: 622, top: 108, width: 500, height: 386, radius: 18 });
  const content = recipe.content ?? {};
  const headline = content.headlineLines ?? [content.headline ?? ""];
  const proof = content.proofLines ?? [];
  const gridLines = Array.from({ length: 18 }, (_, i) => `<line x1="${i * 72}" y1="0" x2="${i * 72 - 260}" y2="${height}"/>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${theme.bg0}"/><stop offset="1" stop-color="${theme.bg1}"/></linearGradient>
    <radialGradient id="glow" cx="0.55" cy="0" r="0.8"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0.15"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000" flood-opacity="0.5"/></filter>
    ${image ? `<clipPath id="mediaClip"><rect x="${image.slot.left}" y="${image.slot.top}" width="${image.slot.width}" height="${image.slot.height}" rx="${image.slot.radius ?? 18}"/></clipPath>` : ""}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/><rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g opacity="0.13" stroke="${theme.border}" stroke-width="1">${gridLines}</g>
  <g transform="translate(70 68)">
    <text x="0" y="0" font-family="Consolas, Menlo, monospace" font-size="15" font-weight="700" fill="${theme.accent}" letter-spacing="2.4">${safe(content.eyebrow ?? "OPEN HARNESS GUIDE")}</text>
    <text x="0" y="112" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" fill="${theme.text}">${tspans(headline, 0, 0, 74)}</text>
    <text x="0" y="360" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="500" fill="${theme.muted}">${tspans(proof, 0, 0, 36)}</text>
    <rect x="0" y="445" rx="14" width="455" height="72" fill="${theme.surface}" stroke="${theme.border}"/>
    <text x="24" y="474" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="${theme.accent2}">${safe(content.ctaTitle ?? "")}</text>
    <text x="24" y="503" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${theme.code}">${safe(content.ctaBody ?? "")}</text>
    <text x="0" y="560" font-family="Consolas, Menlo, monospace" font-size="19" fill="${theme.accent}">${safe(content.footerUrl ?? "")}</text>
  </g>
  ${image ? `<g filter="url(#shadow)"><rect x="${image.slot.left - 22}" y="${image.slot.top - 22}" width="${image.slot.width + 44}" height="${image.slot.height + 44}" rx="26" fill="${theme.surface}" stroke="${theme.border}"/></g><image x="${image.slot.left}" y="${image.slot.top}" width="${image.slot.width}" height="${image.slot.height}" href="${image.data}" clip-path="url(#mediaClip)"/>` : ""}
</svg>`;
}

async function renderSiteHeroCard() {
  const content = recipe.content ?? {};
  const terminalLines = content.terminalLines ?? [];
  const steps = content.steps ?? [];
  const meta = content.meta ?? [];
  const terminalRows = terminalLines.map((line, index) => {
    const y = 194 + index * 28;
    const prompt = line.prompt ? `<tspan fill="${theme.accent}">${safe(line.prompt)}</tspan>` : "";
    const text = `<tspan fill="${line.muted ? theme.muted : theme.code}">${safe(line.text ?? line)}</tspan>`;
    return `<text x="662" y="${y}" font-family="Consolas, Menlo, monospace" font-size="17">${prompt}${text}</text>`;
  }).join("\n");
  const stepRows = steps.map((step, index) => {
    const x = 92 + index * 252;
    return `<g transform="translate(${x} 532)">
      <circle cx="0" cy="0" r="18" fill="${theme.accent}" fill-opacity="0.13" stroke="${theme.accent}" stroke-opacity="0.42"/>
      <text x="0" y="7" font-family="Consolas, Menlo, monospace" font-size="18" font-weight="800" fill="${theme.accent}" text-anchor="middle">${index + 1}</text>
      <text x="0" y="48" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="${theme.text}" text-anchor="middle">${safe(step)}</text>
    </g>`;
  }).join("\n");
  const metaText = meta.map(safe).join("   ·   ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="heroGlow" cx="50%" cy="0%" r="74%"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0.12"/><stop offset="0.62" stop-color="${theme.accent}" stop-opacity="0.03"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
    <filter id="terminalShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000" flood-opacity="0.55"/></filter>
  </defs>
  <rect width="1200" height="675" fill="#000"/>
  <rect width="1200" height="675" fill="url(#heroGlow)"/>
  <line x1="0" y1="56" x2="1200" y2="56" stroke="${theme.border}"/>
  <text x="70" y="36" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="${theme.text}">Open Harness</text>
  <text x="1048" y="36" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="600" fill="${theme.muted}">Blog guide</text>

  <g transform="translate(70 106)">
    <text x="0" y="0" font-family="Consolas, Menlo, monospace" font-size="14" font-weight="700" fill="${theme.accent}" letter-spacing="2.5">${safe(content.eyebrow ?? "PORTABLE AGENT HARNESS")}</text>
    <text x="0" y="78" font-family="Arial, Helvetica, sans-serif" font-size="67" font-weight="900" fill="${theme.text}" letter-spacing="-1.7">${tspans(content.headlineLines ?? [], 0, 0, 74)}</text>
    <text x="0" y="250" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${theme.muted}" letter-spacing="-0.2">${tspans(content.subtitleLines ?? [], 0, 0, 34)}</text>
    <rect x="0" y="330" width="520" height="62" rx="10" fill="${theme.text}"/>
    <text x="25" y="370" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="#000">${safe(content.cta ?? "")}</text>
  </g>

  <g filter="url(#terminalShadow)">
    <rect x="622" y="126" width="520" height="326" rx="12" fill="${theme.surface}" stroke="${theme.border}"/>
    <rect x="622" y="126" width="520" height="44" rx="12" fill="#000" stroke="${theme.border}"/>
    <circle cx="650" cy="148" r="7" fill="${theme.red}"/>
    <circle cx="674" cy="148" r="7" fill="${theme.amber}"/>
    <circle cx="698" cy="148" r="7" fill="${theme.accent}"/>
    <text x="732" y="154" font-family="Consolas, Menlo, monospace" font-size="13" fill="${theme.muted}">~/openharness — zsh</text>
    ${terminalRows}
    <rect x="654" y="384" width="452" height="42" rx="8" fill="#000" stroke="${theme.border}"/>
    <text x="674" y="411" font-family="Consolas, Menlo, monospace" font-size="16" fill="${theme.accent}">.oh/worktrees/&lt;task&gt; → issue → branch → PR</text>
  </g>

  <line x1="70" y1="498" x2="1130" y2="498" stroke="${theme.border}"/>
  ${stepRows}
  <text x="70" y="642" font-family="Consolas, Menlo, monospace" font-size="15" fill="${theme.muted}">${safe(content.footerUrl ?? "")}${metaText ? "   ·   " : ""}${metaText}</text>
</svg>`;
}

let svg;
if (recipe.template === "proof-path-card-v1") {
  svg = await renderProofPathCard();
} else if (recipe.template === "site-hero-card-v1") {
  svg = await renderSiteHeroCard();
} else {
  throw new Error(`Unsupported banner template: ${recipe.template}`);
}

const svgOutput = path.resolve(path.dirname(recipePath), recipe.outputs.svg);
const jpgOutput = path.resolve(path.dirname(recipePath), recipe.outputs.jpg);
await fs.mkdir(path.dirname(svgOutput), { recursive: true });
await fs.mkdir(path.dirname(jpgOutput), { recursive: true });
await fs.writeFile(svgOutput, svg);
await sharp(Buffer.from(svg)).jpeg({ quality: recipe.outputs.jpgQuality ?? 92, mozjpeg: true }).toFile(jpgOutput);

const metadata = await sharp(jpgOutput).metadata();
console.log(JSON.stringify({
  recipe: rel(recipePath),
  svg: rel(svgOutput),
  jpg: rel(jpgOutput),
  width: metadata.width,
  height: metadata.height,
}, null, 2));
