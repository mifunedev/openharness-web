#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import React from "react";
import satori from "satori";
import sharp from "sharp";

const cwd = process.cwd();
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const recipeArg = args[0];
if (!recipeArg) {
  console.error("Usage: node scripts/render-blog-banner.mjs <recipe.json>");
  process.exit(1);
}

const h = React.createElement;
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

const rel = (target) => path.relative(cwd, target);
const withAlpha = (hex, alpha) => {
  const clean = hex.replace("#", "");
  const bigint = Number.parseInt(clean.length === 3
    ? clean.split("").map((char) => char + char).join("")
    : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

async function readFont(candidatePaths, label) {
  for (const candidate of candidatePaths) {
    try {
      return await fs.readFile(candidate);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`Missing font for ${label}. Tried: ${candidatePaths.join(", ")}`);
}

async function loadFonts() {
  const sans = await readFont([
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  ], "sans regular");
  const sansBold = await readFont([
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
  ], "sans bold");
  const mono = await readFont([
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf",
  ], "mono regular");
  const monoBold = await readFont([
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationMono-Bold.ttf",
  ], "mono bold");

  return [
    { name: "InterFallback", data: sans, weight: 400, style: "normal" },
    { name: "InterFallback", data: sansBold, weight: 700, style: "normal" },
    { name: "MonoFallback", data: mono, weight: 400, style: "normal" },
    { name: "MonoFallback", data: monoBold, weight: 700, style: "normal" },
  ];
}

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

const lineStack = (lines, style, lineGap = 0) => h(
  "div",
  { style: { display: "flex", flexDirection: "column" } },
  ...(lines ?? []).map((line, index) => h("div", {
    key: `${line}-${index}`,
    style: {
      ...style,
      marginTop: index === 0 ? 0 : lineGap,
    },
  }, line)),
);

async function renderProofPathCard() {
  const image = await loadImageData(recipe.media, { left: 622, top: 108, width: 500, height: 386, radius: 18 });
  const content = recipe.content ?? {};

  return h("div", {
    style: {
      width,
      height,
      display: "flex",
      position: "relative",
      backgroundColor: theme.bg0,
      color: theme.text,
      fontFamily: "InterFallback",
      overflow: "hidden",
    },
  },
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        inset: 0,
        backgroundColor: theme.bg1,
      },
    }),
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        left: -120,
        top: -180,
        width: 760,
        height: 760,
        borderRadius: 760,
        backgroundColor: withAlpha(theme.accent, 0.10),
      },
    }),
    h("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        left: 70,
        top: 68,
        width: 500,
      },
    },
      h("div", {
        style: {
          fontFamily: "MonoFallback",
          fontSize: 15,
          fontWeight: 700,
          color: theme.accent,
          letterSpacing: 2.4,
          textTransform: "uppercase",
        },
      }, content.eyebrow ?? "OPEN HARNESS GUIDE"),
      h("div", { style: { display: "flex", flexDirection: "column", marginTop: 60 } },
        lineStack(content.headlineLines ?? [content.headline ?? ""], {
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: -1.2,
          lineHeight: 1.05,
          color: theme.text,
        }, 6),
      ),
      h("div", { style: { display: "flex", flexDirection: "column", marginTop: 38 } },
        lineStack(content.proofLines ?? [], {
          fontSize: 25,
          lineHeight: 1.3,
          color: theme.muted,
        }, 3),
      ),
      h("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginTop: 42,
          width: 455,
          height: 72,
          borderRadius: 14,
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          paddingLeft: 24,
        },
      },
        h("div", { style: { fontSize: 18, fontWeight: 700, color: theme.accent2 } }, content.ctaTitle ?? ""),
        h("div", { style: { marginTop: 8, fontSize: 18, color: theme.code } }, content.ctaBody ?? ""),
      ),
      h("div", {
        style: {
          marginTop: 34,
          fontFamily: "MonoFallback",
          fontSize: 19,
          color: theme.accent,
        },
      }, content.footerUrl ?? ""),
    ),
    image && h("div", {
      style: {
        display: "flex",
        position: "absolute",
        left: image.slot.left - 22,
        top: image.slot.top - 22,
        width: image.slot.width + 44,
        height: image.slot.height + 44,
        borderRadius: (image.slot.radius ?? 18) + 8,
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        padding: 22,
      },
    }, h("img", {
      src: image.data,
      style: {
        width: image.slot.width,
        height: image.slot.height,
        borderRadius: image.slot.radius ?? 18,
        objectFit: "cover",
      },
    })),
  );
}

async function renderSiteHeroCard() {
  const content = recipe.content ?? {};
  const terminalLines = content.terminalLines ?? [];
  const steps = content.steps ?? [];
  const meta = content.meta ?? [];

  return h("div", {
    style: {
      width,
      height,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      backgroundColor: theme.bg0,
      color: theme.text,
      fontFamily: "InterFallback",
      overflow: "hidden",
    },
  },
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        left: 255,
        top: -475,
        width: 920,
        height: 920,
        borderRadius: 920,
        backgroundColor: withAlpha(theme.accent, 0.10),
      },
    }),
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: 56,
        borderBottom: `1px solid ${theme.border}`,
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 70,
        paddingRight: 70,
      },
    },
      h("div", { style: { fontSize: 18, fontWeight: 700 } }, "Open Harness"),
      h("div", { style: { fontSize: 15, fontWeight: 700, color: theme.muted } }, "Blog guide"),
    ),

    h("div", {
      style: {
        display: "flex",
        flexDirection: "row",
        position: "absolute",
        left: 70,
        top: 106,
        width: 1060,
        height: 370,
        justifyContent: "space-between",
      },
    },
      h("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 520,
        },
      },
        h("div", {
          style: {
            fontFamily: "MonoFallback",
            fontSize: 14,
            fontWeight: 700,
            color: theme.accent,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          },
        }, content.eyebrow ?? "PORTABLE AGENT HARNESS"),
        h("div", { style: { display: "flex", flexDirection: "column", marginTop: 38 } },
          lineStack(content.headlineLines ?? [], {
            fontSize: 58,
            fontWeight: 700,
            letterSpacing: -1.4,
            lineHeight: 1.03,
            color: theme.text,
            whiteSpace: "nowrap",
          }, 5),
        ),
        h("div", { style: { display: "flex", flexDirection: "column", marginTop: 30 } },
          lineStack(content.subtitleLines ?? [], {
            fontSize: 23,
            lineHeight: 1.25,
            color: theme.muted,
            whiteSpace: "nowrap",
          }, 3),
        ),
        h("div", {
          style: {
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            width: 500,
            height: 54,
            borderRadius: 10,
            backgroundColor: theme.text,
            color: "#000000",
            paddingLeft: 25,
            fontSize: 18,
            fontWeight: 700,
          },
        }, content.cta ?? ""),
      ),

      h("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 520,
          height: 326,
          borderRadius: 12,
          backgroundColor: theme.surface,
          border: `1px solid ${theme.border}`,
          overflow: "hidden",
        },
      },
        h("div", {
          style: {
            display: "flex",
            alignItems: "center",
            width: "100%",
            height: 44,
            backgroundColor: "#000000",
            borderBottom: `1px solid ${theme.border}`,
            paddingLeft: 28,
          },
        },
          h("div", { style: { width: 14, height: 14, borderRadius: 14, backgroundColor: theme.red, marginRight: 10 } }),
          h("div", { style: { width: 14, height: 14, borderRadius: 14, backgroundColor: theme.amber, marginRight: 10 } }),
          h("div", { style: { width: 14, height: 14, borderRadius: 14, backgroundColor: theme.accent, marginRight: 24 } }),
          h("div", { style: { fontFamily: "MonoFallback", fontSize: 13, color: theme.muted } }, "~/openharness — zsh"),
        ),
        h("div", {
          style: {
            display: "flex",
            flexDirection: "column",
            paddingLeft: 31,
            paddingRight: 31,
            paddingTop: 19,
          },
        },
          ...terminalLines.map((line, index) => h("div", {
            key: `terminal-${index}`,
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              fontFamily: "MonoFallback",
              fontSize: 17,
              lineHeight: 1.2,
              marginTop: index === 0 ? 0 : 11,
              color: line.muted ? theme.muted : theme.code,
            },
          },
            line.prompt ? h("span", { style: { color: theme.accent } }, line.prompt) : null,
            h("span", { style: { color: line.muted ? theme.muted : theme.code } }, line.text ?? line),
          )),
          h("div", {
            style: {
              display: "flex",
              alignItems: "center",
              marginTop: 21,
              width: 452,
              height: 42,
              borderRadius: 8,
              backgroundColor: "#000000",
              border: `1px solid ${theme.border}`,
              paddingLeft: 19,
              fontFamily: "MonoFallback",
              fontSize: 16,
              color: theme.accent,
            },
          }, ".oh/worktrees/<task> → issue → branch → PR"),
        ),
      ),
    ),

    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        left: 70,
        top: 498,
        width: 1060,
        height: 1,
        backgroundColor: theme.border,
      },
    }),
    h("div", {
      style: {
        display: "flex",
        flexDirection: "row",
        position: "absolute",
        left: 70,
        top: 514,
        width: 1060,
        justifyContent: "space-between",
      },
    },
      ...steps.map((step, index) => h("div", {
        key: `step-${step}`,
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 150,
        },
      },
        h("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 38,
            border: `1px solid ${withAlpha(theme.accent, 0.42)}`,
            backgroundColor: withAlpha(theme.accent, 0.13),
            fontFamily: "MonoFallback",
            fontSize: 18,
            fontWeight: 700,
            color: theme.accent,
          },
        }, String(index + 1)),
        h("div", {
          style: {
            marginTop: 20,
            fontSize: 17,
            fontWeight: 700,
            color: theme.text,
            textAlign: "center",
          },
        }, step),
      )),
    ),
    h("div", {
      style: {
        display: "flex",
        position: "absolute",
        left: 70,
        top: 628,
        width: 1060,
        fontFamily: "MonoFallback",
        fontSize: 13,
        color: theme.muted,
        whiteSpace: "nowrap",
      },
    }, `${content.footerUrl ?? ""}${meta.length ? "   ·   " : ""}${meta.join("   ·   ")}`),
  );
}

let element;
if (recipe.template === "proof-path-card-v1") {
  element = await renderProofPathCard();
} else if (recipe.template === "site-hero-card-v1") {
  element = await renderSiteHeroCard();
} else {
  throw new Error(`Unsupported banner template: ${recipe.template}`);
}

const svgOutput = path.resolve(path.dirname(recipePath), recipe.outputs.svg);
const jpgOutput = path.resolve(path.dirname(recipePath), recipe.outputs.jpg);
await fs.mkdir(path.dirname(svgOutput), { recursive: true });
await fs.mkdir(path.dirname(jpgOutput), { recursive: true });

const svg = await satori(element, {
  width,
  height,
  fonts: await loadFonts(),
});
await fs.writeFile(svgOutput, svg);
await sharp(Buffer.from(svg)).jpeg({ quality: recipe.outputs.jpgQuality ?? 92, mozjpeg: true }).toFile(jpgOutput);

const metadata = await sharp(jpgOutput).metadata();
console.log(JSON.stringify({
  recipe: rel(recipePath),
  renderer: "satori-html-layout-v1",
  svg: rel(svgOutput),
  jpg: rel(jpgOutput),
  width: metadata.width,
  height: metadata.height,
}, null, 2));
