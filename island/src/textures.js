import * as THREE from 'three';
import { ACCENT, GRAY, INK } from './materials.js';

/* ---------- Canvas 貼圖 ----------
 * 用 2D canvas 畫平面圖案（鐘面、編號、指標名稱），再貼到 MeshBasicMaterial 上。
 * 字型載入完成時會重畫一次，避免先用預設字型畫出來。
 */
const items = [];
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8;
  const item = { redraw() { ctx.clearRect(0, 0, w, h); draw(ctx, w, h); tex.needsUpdate = true; } };
  item.redraw(); items.push(item);
  return tex;
}
if (document.fonts) document.fonts.ready.then(() => items.forEach(t => t.redraw()));

const BG = { white: '#ffffff', gray: GRAY, accent: ACCENT };

function drawClock(ctx, w, h) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, r1 = i % 3 ? 96 : 84;
    ctx.lineWidth = i % 3 ? 6 : 12;
    ctx.beginPath();
    ctx.moveTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1);
    ctx.lineTo(w / 2 + Math.cos(a) * 110, h / 2 + Math.sin(a) * 110);
    ctx.stroke();
  }
}
export const clockMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, drawClock), name: 'clock' });

/** 方塊頂面的編號（例如題號、輪次）。tone：white / gray / accent */
const numCache = new Map();
export function numMat(text, tone = 'white') {
  const key = text + '|' + tone;
  if (!numCache.has(key)) {
    numCache.set(key, new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (ctx, w, h) => {
      ctx.fillStyle = BG[tone]; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 ${text.length > 1 ? 62 : 72}px "Noto Sans TC", sans-serif`;
      ctx.fillText(text, w / 2, h / 2 + 4);
    }) }));
  }
  return numCache.get(key);
}

/** 直立的文字牌（指標名稱）。 */
export function signMat(text, tone = 'white') {
  return new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = BG[tone]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 92px "Noto Sans TC", sans-serif';
    ctx.fillText(text.slice(0, 2), w / 2, h / 2 - 50);
    ctx.fillText(text.slice(2), w / 2, h / 2 + 56);
  }) });
}

/** 竹編、藤編紋路：白底斜向交叉細線。魚筌、背簍、斗笠、桌罩、菜櫥門板共用 */
function drawWeave(ctx, w, h) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (let i = -w; i < w * 2; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, h); ctx.lineTo(i + h, 0); ctx.stroke();
  }
}
const weaveTex = canvasTex(128, 128, drawWeave);
weaveTex.wrapS = weaveTex.wrapT = THREE.RepeatWrapping; weaveTex.repeat.set(3, 2);
export const weaveMat = new THREE.MeshBasicMaterial({ map: weaveTex, side: THREE.DoubleSide, name: 'weave' });

/** 磚牆：灰底、白色灰縫。土灶用 */
function drawBrick(ctx, w, h) {
  ctx.fillStyle = GRAY; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  for (let r = 0; r < 4; r++) {
    const y = r * 32;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    for (let x = (r % 2) * 32; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke(); }
  }
}
const brickTex = canvasTex(128, 128, drawBrick);
brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping; brickTex.repeat.set(2, 1);
export const brickMat = new THREE.MeshBasicMaterial({ map: brickTex, name: 'brick' });
