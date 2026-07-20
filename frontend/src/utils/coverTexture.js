import * as THREE from "three";

const GOLD = "#d6ad45";
const GOLD_SOFT = "rgba(214, 173, 69, 0.8)";
const cache = new Map();

const FONT_PRELOADS = ["600 56px Vazirmatn", "500 34px Vazirmatn", "600 42px Vazirmatn"];
let fontsReady = false;
const fontsPromise = typeof document !== "undefined" && document.fonts
  ? Promise.all(FONT_PRELOADS.map((font) => document.fonts.load(font, "کتاب"))).then(() => { fontsReady = true; }).catch(() => {})
  : Promise.resolve();

function makeTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  // Vazirmatn may not be loaded on first paint — redraw once webfonts settle.
  if (!fontsReady) fontsPromise.then(() => { draw(ctx); texture.needsUpdate = true; });
  return texture;
}

function leatherBase(ctx, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.16, width / 2, height / 2, height * 0.75);
  vignette.addColorStop(0, "rgba(255, 240, 205, 0.10)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  // leather grain speckle
  for (let i = 0; i < width * 1.5; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 240, 205, 0.03)";
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.6, 1.6);
  }
}

function embossedFrame(ctx, x, y, width, height, lineWidth) {
  // emboss illusion: shadow stroke shifted down-right, highlight up-left, gold line on top
  ctx.lineWidth = lineWidth + 2;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
  ctx.strokeRect(x + 2, y + 2, width, height);
  ctx.strokeStyle = "rgba(255, 240, 205, 0.22)";
  ctx.strokeRect(x - 2, y - 2, width, height);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(x, y, width, height);
}

function diamond(ctx, x, y, size, fill = GOLD) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = fill;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function createCoverTexture(book, color) {
  const titleFa = book.title_fa || "";
  const titleEn = book.title_en || "";
  const authorFa = book.author_fa || book.author_en || "";
  const key = `cover|${titleFa}|${titleEn}|${authorFa}|${color}`;
  if (cache.has(key)) return cache.get(key);

  const texture = makeTexture(512, 768, (ctx) => {
    leatherBase(ctx, 512, 768, color);
    embossedFrame(ctx, 30, 30, 452, 708, 4);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = GOLD_SOFT;
    ctx.strokeRect(46, 46, 420, 676);
    [[46, 46], [466, 46], [46, 722], [466, 722]].forEach(([cx, cy]) => diamond(ctx, cx, cy, 14));

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.direction = "rtl";
    ctx.fillStyle = GOLD;
    ctx.font = "600 56px Vazirmatn, Georgia, serif";
    const lines = wrapLines(ctx, titleFa || titleEn, 380);
    lines.forEach((line, index) => ctx.fillText(line, 256, 180 + index * 72));
    const dividerY = 180 + (lines.length - 0.5) * 72;

    ctx.shadowColor = "transparent";
    ctx.fillStyle = GOLD_SOFT;
    ctx.fillRect(176, dividerY, 160, 2);
    diamond(ctx, 256, dividerY + 1, 10);

    if (titleEn && titleFa) {
      ctx.direction = "ltr";
      ctx.font = "italic 27px Georgia, serif";
      ctx.fillStyle = GOLD_SOFT;
      ctx.fillText(titleEn, 256, dividerY + 52);
    }

    // center emblem
    ctx.strokeStyle = GOLD_SOFT;
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(256, 478);
    ctx.rotate(Math.PI / 4);
    ctx.strokeRect(-34, -34, 68, 68);
    ctx.strokeRect(-22, -22, 44, 44);
    ctx.restore();
    diamond(ctx, 256, 478, 14);

    ctx.direction = "rtl";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.font = "500 34px Vazirmatn, Georgia, serif";
    ctx.fillStyle = GOLD;
    ctx.fillText(authorFa, 256, 644, 380);
  });
  cache.set(key, texture);
  return texture;
}

export function createSpineTexture(book, color) {
  const title = book.title_fa || book.title_en || "";
  const key = `spine|${title}|${color}`;
  if (cache.has(key)) return cache.get(key);

  const texture = makeTexture(128, 640, (ctx) => {
    leatherBase(ctx, 128, 640, color);
    // raised gold bands, top and bottom pairs
    [[38, 46], [86, 94], [546, 554], [594, 602]].forEach(([top, bottom]) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(10, top + 2, 108, bottom - top);
      ctx.fillStyle = GOLD;
      ctx.fillRect(10, top, 108, bottom - top);
    });
    // vertical (top-to-bottom) title
    ctx.save();
    ctx.translate(64, 310);
    ctx.rotate(Math.PI / 2);
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = GOLD;
    ctx.font = "600 42px Vazirmatn, Georgia, serif";
    ctx.fillText(title, 0, 0, 380);
    ctx.restore();
    diamond(ctx, 64, 573, 12);
  });
  cache.set(key, texture);
  return texture;
}

export function clearCoverTextureCache() {
  cache.forEach((texture) => texture.dispose());
  cache.clear();
}
