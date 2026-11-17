import { dishArt } from './dishart.js';

const CARD_W = 1080;
const CARD_H = 1350;
const SERIF = '"Noto Serif SC", "Songti SC", "STSong", serif';
const SANS = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
const INK = '#5b564c';
const INK_SOFT = '#8a8377';
const SAGE = '#6f8a6b';
const PAPER = '#fbf6ec';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'sync';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片载入失败：${src}`));
    img.src = src;
  });
}

async function tryLoadImage(src) {
  try {
    return await loadImage(src);
  } catch (error) {
    return null;
  }
}

function drawSoftPlaceholder(ctx, x, y, w, h) {
  const grad = ctx.createRadialGradient(x + w * 0.4, y + h * 0.38, 0, x + w * 0.4, y + h * 0.38, w * 0.7);
  grad.addColorStop(0, 'rgba(147, 169, 141, 0.45)');
  grad.addColorStop(0.55, 'rgba(240, 183, 160, 0.32)');
  grad.addColorStop(1, 'rgba(251, 246, 236, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function drawPaper(ctx, w, h) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const washes = [
    [w * 0.18, h * 0.12, w * 0.5, 'rgba(243, 217, 164, 0.3)'],
    [w * 0.86, h * 0.3, w * 0.46, 'rgba(240, 183, 160, 0.24)'],
    [w * 0.3, h * 0.88, w * 0.56, 'rgba(147, 169, 141, 0.22)']
  ];
  for (const [x, y, r, color] of washes) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 2200; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.5 + 0.4;
    ctx.fillStyle = Math.random() > 0.5 ? '#7d7466' : '#c9bda6';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function archPath(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

function drawImageContained(ctx, img, x, y, w, h) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = [...text];
  const lines = [];
  let current = '';
  for (const ch of chars) {
    if (current && ctx.measureText(current + ch).width > maxWidth) {
      lines.push(current);
      current = ch;
      if (lines.length === maxLines) break;
    } else {
      current += ch;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
  return lines.length;
}

function drawTop(ctx, gardenName) {
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `500 34px ${SERIF}`;
  ctx.fillText(gardenName, 96, 132);
  ctx.textAlign = 'right';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 24px ${SANS}`;
  ctx.fillText(formatDate(), CARD_W - 96, 130);
}

async function createPlantCard(state, plant, stageName, days) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  drawPaper(ctx, CARD_W, CARD_H);
  drawTop(ctx, state.gardenName);

  const frameX = 150;
  const frameY = 208;
  const frameW = CARD_W - frameX * 2;
  const frameH = 700;

  ctx.save();
  archPath(ctx, frameX, frameY, frameW, frameH);
  ctx.clip();
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  const img = await tryLoadImage(plant.currentImage);
  if (img) {
    ctx.save();
    ctx.shadowColor = 'rgba(120, 96, 70, 0.18)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = 'rgba(120, 96, 70, 0.1)';
    ctx.beginPath();
    ctx.ellipse(frameX + frameW / 2, frameY + frameH - 120, 150, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawImageContained(ctx, img, frameX + 40, frameY + 70, frameW - 80, frameH - 150);
  } else {
    drawSoftPlaceholder(ctx, frameX, frameY, frameW, frameH);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `600 66px ${SERIF}`;
  ctx.fillText(plant.name, CARD_W / 2, 1030);

  ctx.fillStyle = SAGE;
  ctx.font = `400 32px ${SANS}`;
  ctx.fillText(stageName, CARD_W / 2, 1084);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 27px ${SANS}`;
  ctx.fillText(`${days} 天`, CARD_W / 2, 1148);

  return canvas;
}

async function createDishCard(state, dish, usedIds) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  drawPaper(ctx, CARD_W, CARD_H);
  drawTop(ctx, state.gardenName);

  const frameX = 150;
  const frameY = 206;
  const frameW = CARD_W - frameX * 2;
  const frameH = 700;

  ctx.save();
  archPath(ctx, frameX, frameY, frameW, frameH);
  ctx.clip();
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(dishArt(dish, usedIds))}`;
  const img = await tryLoadImage(uri);
  if (img) {
    drawImageContained(ctx, img, frameX + 60, frameY + 90, frameW - 120, frameH - 180);
  } else {
    drawSoftPlaceholder(ctx, frameX, frameY, frameW, frameH);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = SAGE;
  ctx.font = `400 28px ${SANS}`;
  ctx.fillText(dish.type, CARD_W / 2, 1034);

  ctx.fillStyle = INK;
  ctx.font = `600 58px ${SERIF}`;
  wrapText(ctx, dish.name, CARD_W / 2, 1112, CARD_W - 240, 74, 2);

  return canvas;
}

export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/jpeg', 0.9);
}

export function downloadCanvas(canvas, filename) {
  const url = canvas.toDataURL('image/jpeg', 0.92);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function shareCanvas(canvas, filename, caption) {
  const blob = await canvasToBlob(canvas);
  if (!blob) return { ok: false, reason: '导出失败' };

  const file = new File([blob], filename, { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: caption, text: caption });
      return { ok: true, mode: 'share' };
    } catch (error) {
      if (error && error.name === 'AbortError') return { ok: false, reason: 'cancel' };
    }
  }

  downloadCanvas(canvas, filename);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(caption);
    } catch (error) {
      /* 复制失败时仅保存图片 */
    }
  }
  return { ok: true, mode: 'download' };
}

export async function buildPlantCard({ state, plant, stageName, days }) {
  const canvas = await createPlantCard(state, plant, stageName, days);
  const filename = `${state.gardenName}-${plant.name}-${stageName}.jpg`;
  return { canvas, filename, caption: `${state.gardenName}｜${plant.name} · ${stageName}` };
}

export async function buildDishCard({ state, dish, usedFruits }) {
  const canvas = await createDishCard(state, dish, usedFruits.map((fruit) => fruit.id));
  const filename = `${state.gardenName}-${dish.name}.jpg`;
  return { canvas, filename, caption: `${state.gardenName}｜${dish.name}` };
}
