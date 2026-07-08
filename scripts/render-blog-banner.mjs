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
  bg0: recipe.theme?.bg0 ?? "#07111f",
  bg1: recipe.theme?.bg1 ?? "#0b1728",
  bg2: recipe.theme?.bg2 ?? "#102a2b",
  accent: recipe.theme?.accent ?? "#5eead4",
  accent2: recipe.theme?.accent2 ?? "#22c55e",
  accentSoft: recipe.theme?.accentSoft ?? "#d6fff6",
  success: recipe.theme?.success ?? "#4ade80",
  text: recipe.theme?.text ?? "#f8fafc",
  muted: recipe.theme?.muted ?? "#cbd5e1",
  paper: recipe.theme?.paper ?? "#f7f3ea",
  ink: recipe.theme?.ink ?? "#111827",
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
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${theme.bg0}"/><stop offset="0.55" stop-color="${theme.bg1}"/><stop offset="1" stop-color="${theme.bg2}"/></linearGradient>
    <radialGradient id="glow" cx="0.7" cy="0.2" r="0.75"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0.26"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000" flood-opacity="0.38"/></filter>
    <clipPath id="mediaClip"><rect x="${image.slot.left}" y="${image.slot.top}" width="${image.slot.width}" height="${image.slot.height}" rx="${image.slot.radius ?? 18}"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/><rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g opacity="0.18" stroke="${theme.accent}" stroke-width="1">${gridLines}</g>
  <circle cx="1035" cy="95" r="135" fill="${theme.accent}" opacity="0.09"/><circle cx="1110" cy="565" r="95" fill="${theme.accentSoft}" opacity="0.08"/>
  <g transform="translate(70 68)">
    <rect x="0" y="0" rx="18" width="${recipe.layout?.eyebrowWidth ?? 240}" height="38" fill="${theme.accentSoft}" fill-opacity="0.10" stroke="${theme.accent}" stroke-opacity="0.36"/>
    <text x="18" y="25" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="${theme.accentSoft}" letter-spacing="2.5">${safe(content.eyebrow ?? "BLOG GUIDE")}</text>
    <text x="0" y="112" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" fill="${theme.text}">${tspans(headline, 0, 0, 74)}</text>
    <text x="0" y="360" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="500" fill="${theme.muted}">${tspans(proof, 0, 0, 36)}</text>
    <rect x="0" y="445" rx="18" width="455" height="72" fill="#0f241f" stroke="${theme.success}" stroke-opacity="0.35"/>
    <text x="24" y="474" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#bbf7d0">${safe(content.ctaTitle ?? "")}</text>
    <text x="24" y="503" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#d1fae5">${safe(content.ctaBody ?? "")}</text>
    <text x="0" y="560" font-family="Consolas, Menlo, monospace" font-size="19" fill="#99f6e4">${safe(content.footerUrl ?? "")}</text>
  </g>
  <g filter="url(#shadow)"><rect x="${image.slot.left - 22}" y="${image.slot.top - 22}" width="${image.slot.width + 44}" height="${image.slot.height + 44}" rx="26" fill="#0f172a" stroke="#e2e8f0" stroke-opacity="0.16"/></g>
  <image x="${image.slot.left}" y="${image.slot.top}" width="${image.slot.width}" height="${image.slot.height}" href="${image.data}" clip-path="url(#mediaClip)"/>
  <text x="${image.slot.left}" y="558" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${theme.text}">${safe(content.mediaTitle ?? "")}</text>
  <text x="${image.slot.left}" y="590" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${theme.muted}">${safe(content.mediaBody ?? "")}</text>
</svg>`;
}

async function renderChecklistCard() {
  const media = await loadImageData(recipe.media, { left: 70, top: 390, width: 510, height: 205, radius: 22 });
  const content = recipe.content ?? {};
  const headline = content.headlineLines ?? [content.headline ?? ""];
  const subtitle = content.subtitleLines ?? [];
  const checklist = content.checklist ?? [];
  const grid = Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${80 + i * 38}" x2="1200" y2="${80 + i * 38}"/>`).join("\n");
  const layout = recipe.layout ?? {};
  const subtitleY = layout.subtitleY ?? 285;
  const subtitleSize = layout.subtitleSize ?? 25;
  const ctaY = layout.ctaY ?? 526;
  const ctaWidth = layout.ctaWidth ?? 500;
  const ctaTextSize = layout.ctaTextSize ?? 20;
  const footerY = layout.footerY ?? 612;
  const cards = checklist.map((item, index) => {
    const y = 132 + index * 76;
    return `<g transform="translate(705 ${y})">
      <rect x="0" y="0" width="392" height="58" rx="17" fill="#ffffff" stroke="#d8d0c5"/>
      <circle cx="31" cy="29" r="15" fill="${theme.accent2}" opacity="0.15"/>
      <text x="24" y="35" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" fill="${theme.accent2}">✓</text>
      <text x="58" y="24" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="800" fill="#6b7280" letter-spacing="1.5">${safe(item.kicker ?? String(index + 1).padStart(2, "0"))}</text>
      <text x="58" y="45" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" fill="${theme.ink}">${safe(item.text ?? item)}</text>
    </g>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${theme.paper}"/><stop offset="1" stop-color="#efe8dc"/></linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.18"/></filter>
    <clipPath id="mediaClip"><rect x="${media.slot.left}" y="${media.slot.top}" width="${media.slot.width}" height="${media.slot.height}" rx="${media.slot.radius ?? 22}"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  <g opacity="0.24" stroke="#d6cec2" stroke-width="1">${grid}</g>
  <circle cx="1020" cy="130" r="170" fill="${theme.accent}" opacity="0.13"/>
  <circle cx="160" cy="610" r="130" fill="${theme.accent2}" opacity="0.10"/>
  <rect x="36" y="36" width="1128" height="603" rx="36" fill="#fffaf2" stroke="#ded6c9"/>

  <g transform="translate(70 72)">
    <rect x="0" y="0" rx="16" width="248" height="38" fill="#ecfdf5" stroke="#99f6e4"/>
    <text x="18" y="25" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" fill="#0f766e" letter-spacing="2.2">${safe(content.eyebrow ?? "OPEN HARNESS")}</text>
    <text x="0" y="110" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900" fill="${theme.ink}">${tspans(headline, 0, 0, 76)}</text>
    <text x="0" y="${subtitleY}" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="500" fill="#475569">${tspans(subtitle, 0, 0, 31)}</text>
    <rect x="0" y="${ctaY}" rx="18" width="${ctaWidth}" height="58" fill="#102a2b"/>
    <text x="22" y="${ctaY + 36}" font-family="Arial, Helvetica, sans-serif" font-size="${ctaTextSize}" font-weight="800" fill="#d1fae5">${safe(content.cta ?? "")}</text>
    <text x="0" y="${footerY}" font-family="Consolas, Menlo, monospace" font-size="18" fill="#0f766e">${safe(content.footerUrl ?? "")}</text>
  </g>

  <g filter="url(#softShadow)">
    <rect x="${media.slot.left - 10}" y="${media.slot.top - 10}" width="${media.slot.width + 20}" height="${media.slot.height + 20}" rx="28" fill="#111827" opacity="0.16"/>
  </g>
  <image x="${media.slot.left}" y="${media.slot.top}" width="${media.slot.width}" height="${media.slot.height}" href="${media.data}" clip-path="url(#mediaClip)"/>

  <text x="705" y="88" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="${theme.ink}">${safe(content.checklistTitle ?? "Setup path")}</text>
  <text x="705" y="116" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#64748b">${safe(content.checklistSubtitle ?? "Concrete checkpoints from the post")}</text>
  ${cards}
</svg>`;
}

let svg;
if (recipe.template === "proof-path-card-v1") {
  svg = await renderProofPathCard();
} else if (recipe.template === "checklist-card-v1") {
  svg = await renderChecklistCard();
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
