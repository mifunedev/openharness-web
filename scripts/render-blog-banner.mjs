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
if (recipe.template !== "proof-path-card-v1") {
  throw new Error(`Unsupported banner template: ${recipe.template}`);
}

const width = recipe.dimensions?.width ?? 1200;
const height = recipe.dimensions?.height ?? 675;
const safe = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const lines = (items = []) => items.map((line) => safe(line));
const theme = {
  bg0: recipe.theme?.bg0 ?? "#07111f",
  bg1: recipe.theme?.bg1 ?? "#0b1728",
  bg2: recipe.theme?.bg2 ?? "#102a2b",
  accent: recipe.theme?.accent ?? "#5eead4",
  accentSoft: recipe.theme?.accentSoft ?? "#d6fff6",
  success: recipe.theme?.success ?? "#4ade80",
  text: recipe.theme?.text ?? "#f8fafc",
  muted: recipe.theme?.muted ?? "#cbd5e1",
};

const imageSlot = recipe.media?.slot ?? { left: 622, top: 108, width: 500, height: 386, radius: 18 };
const sourceImage = path.resolve(path.dirname(recipePath), recipe.media.source);
const imageBuffer = await sharp(sourceImage)
  .resize(imageSlot.width, imageSlot.height, {
    fit: recipe.media.fit ?? "cover",
    position: recipe.media.position ?? "center",
  })
  .jpeg({ quality: 92 })
  .toBuffer();
const imageData = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

function tspans(textLines, x, firstDy, dy) {
  return textLines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? firstDy : dy}">${line}</tspan>`).join("\n");
}

const content = recipe.content ?? {};
const headline = lines(content.headlineLines ?? [content.headline ?? ""]);
const proof = lines(content.proofLines ?? []);
const ctaTitle = safe(content.ctaTitle ?? "");
const ctaBody = safe(content.ctaBody ?? "");
const footer = safe(content.footerUrl ?? "");
const mediaTitle = safe(content.mediaTitle ?? "");
const mediaBody = safe(content.mediaBody ?? "");
const eyebrow = safe(content.eyebrow ?? "BLOG GUIDE");

const gridLines = Array.from({ length: 18 }, (_, i) => `<line x1="${i * 72}" y1="0" x2="${i * 72 - 260}" y2="${height}"/>`).join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${theme.bg0}"/>
      <stop offset="0.55" stop-color="${theme.bg1}"/>
      <stop offset="1" stop-color="${theme.bg2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.7" cy="0.2" r="0.75">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.26"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#000" flood-opacity="0.38"/>
    </filter>
    <clipPath id="mediaClip">
      <rect x="${imageSlot.left}" y="${imageSlot.top}" width="${imageSlot.width}" height="${imageSlot.height}" rx="${imageSlot.radius ?? 18}"/>
    </clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <g opacity="0.18" stroke="${theme.accent}" stroke-width="1">${gridLines}</g>
  <circle cx="1035" cy="95" r="135" fill="${theme.accent}" opacity="0.09"/>
  <circle cx="1110" cy="565" r="95" fill="${theme.accentSoft}" opacity="0.08"/>

  <g transform="translate(70 68)">
    <rect x="0" y="0" rx="18" width="${recipe.layout?.eyebrowWidth ?? 240}" height="38" fill="${theme.accentSoft}" fill-opacity="0.10" stroke="${theme.accent}" stroke-opacity="0.36"/>
    <text x="18" y="25" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="${theme.accentSoft}" letter-spacing="2.5">${eyebrow}</text>

    <text x="0" y="112" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="800" fill="${theme.text}">
      ${tspans(headline, 0, 0, 74)}
    </text>

    <text x="0" y="360" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="500" fill="${theme.muted}">
      ${tspans(proof, 0, 0, 36)}
    </text>

    <rect x="0" y="445" rx="18" width="455" height="72" fill="#0f241f" stroke="${theme.success}" stroke-opacity="0.35"/>
    <text x="24" y="474" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#bbf7d0">${ctaTitle}</text>
    <text x="24" y="503" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#d1fae5">${ctaBody}</text>

    <text x="0" y="560" font-family="Consolas, Menlo, monospace" font-size="19" fill="#99f6e4">${footer}</text>
  </g>

  <g filter="url(#shadow)">
    <rect x="${imageSlot.left - 22}" y="${imageSlot.top - 22}" width="${imageSlot.width + 44}" height="${imageSlot.height + 44}" rx="26" fill="#0f172a" stroke="#e2e8f0" stroke-opacity="0.16"/>
  </g>
  <image x="${imageSlot.left}" y="${imageSlot.top}" width="${imageSlot.width}" height="${imageSlot.height}" href="${imageData}" clip-path="url(#mediaClip)"/>
  <text x="${imageSlot.left}" y="558" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="${theme.text}">${mediaTitle}</text>
  <text x="${imageSlot.left}" y="590" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${theme.muted}">${mediaBody}</text>
</svg>
`;

const svgOutput = path.resolve(path.dirname(recipePath), recipe.outputs.svg);
const jpgOutput = path.resolve(path.dirname(recipePath), recipe.outputs.jpg);
await fs.mkdir(path.dirname(svgOutput), { recursive: true });
await fs.mkdir(path.dirname(jpgOutput), { recursive: true });
await fs.writeFile(svgOutput, svg);
await sharp(Buffer.from(svg)).jpeg({ quality: recipe.outputs.jpgQuality ?? 92, mozjpeg: true }).toFile(jpgOutput);

const metadata = await sharp(jpgOutput).metadata();
console.log(JSON.stringify({
  recipe: path.relative(cwd, recipePath),
  svg: path.relative(cwd, svgOutput),
  jpg: path.relative(cwd, jpgOutput),
  width: metadata.width,
  height: metadata.height,
}, null, 2));
