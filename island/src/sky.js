import * as THREE from 'three';

/* ---------- 淺色星圖底圖 ----------
 * 白底上很淡的天球圓環、放射線、刻度，散落灰色星點與幾組小星座，像一張天文星圖。
 * 畫在一張與畫面同尺寸的 canvas 上，當作 scene.background：
 *   - 不屬於任何 3D 物件，不進描邊用的法線／深度圖，所以不會被描上黑邊
 *   - 不會隨鏡頭移動，平台浮在星圖前面
 * 用固定種子的亂數，所以縮放視窗時星星位置不會整片重洗。
 */
const BG = '#ffffff';
const LINE = 'rgba(22, 22, 22, .075)';
const LINE_DASH = 'rgba(22, 22, 22, .055)';
const STAR = [70, 78, 96];                 // 星點的灰（帶一點藍）

function rng(seed) {                        // mulberry32
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 小星座：0～1 的相對座標（以畫面寬高為準），只放在四個角落附近，避開中間的島
const CONSTELLATIONS = [
  { at: [.08, .62], pts: [[0, 0], [.05, -.04], [.1, -.02], [.13, -.08], [.18, -.06]] },
  { at: [.80, .10], pts: [[0, 0], [.04, .05], [.09, .03], [.12, .08], [.08, .12], [.04, .05]] },
  { at: [.84, .70], pts: [[0, 0], [.03, .06], [.08, .07], [.11, .13]] },
  { at: [.22, .86], pts: [[0, 0], [.06, -.02], [.1, .03], [.16, .01]] },
];

function draw(ctx, w, h, pr) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * .52, R = Math.hypot(w, h) * .5;

  // 天球圓環：實線與虛線交替
  ctx.lineWidth = 1 * pr;
  for (let i = 1; i <= 6; i++) {
    ctx.setLineDash(i % 2 ? [] : [4 * pr, 6 * pr]);
    ctx.strokeStyle = i % 2 ? LINE : LINE_DASH;
    ctx.beginPath(); ctx.arc(cx, cy, R * i / 6.5, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.setLineDash([]);
  // 放射線（每 30°），從第二圈畫到最外圈
  ctx.strokeStyle = LINE_DASH;
  for (let a = 0; a < 360; a += 30) {
    const r = a * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(r) * R * 2 / 6.5, cy + Math.sin(r) * R * 2 / 6.5);
    ctx.lineTo(cx + Math.cos(r) * R, cy + Math.sin(r) * R);
    ctx.stroke();
  }
  // 第五圈上的刻度（每 5°，30° 的倍數較長）
  const rt = R * 5 / 6.5;
  ctx.strokeStyle = LINE;
  for (let a = 0; a < 360; a += 5) {
    const r = a * Math.PI / 180, len = (a % 30 ? 5 : 11) * pr;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(r) * rt, cy + Math.sin(r) * rt);
    ctx.lineTo(cx + Math.cos(r) * (rt + len), cy + Math.sin(r) * (rt + len));
    ctx.stroke();
  }

  // 散落的星點：密度依畫面面積，亮度與大小隨機
  const rand = rng(20261113);
  const n = Math.round(w * h / (pr * pr) / 2600);
  for (let i = 0; i < n; i++) {
    const x = rand() * w, y = rand() * h, a = .18 + rand() * .34, r = (.5 + rand() * 1.1) * pr;
    ctx.fillStyle = `rgba(${STAR},${a})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // 少數亮星：十字星芒
  for (let i = 0; i < 14; i++) {
    const x = rand() * w, y = rand() * h, s = (3 + rand() * 4) * pr;
    ctx.strokeStyle = `rgba(${STAR},.3)`; ctx.lineWidth = .8 * pr;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    ctx.fillStyle = `rgba(${STAR},.45)`;
    ctx.beginPath(); ctx.arc(x, y, 1.2 * pr, 0, Math.PI * 2); ctx.fill();
  }

  // 小星座：細連線＋空心圓星點
  for (const c of CONSTELLATIONS) {
    const pts = c.pts.map(([dx, dy]) => [(c.at[0] + dx) * w, (c.at[1] + dy) * h]);
    ctx.strokeStyle = 'rgba(22, 22, 22, .2)'; ctx.lineWidth = 1 * pr;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    for (const [x, y] of pts) {
      ctx.fillStyle = BG; ctx.strokeStyle = 'rgba(22, 22, 22, .32)'; ctx.lineWidth = 1.1 * pr;
      ctx.beginPath(); ctx.arc(x, y, 2.6 * pr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
}

export function createStarChart() {
  const canvas = document.createElement('canvas');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false;
  return {
    texture,
    /** w, h：CSS 像素；pr：pixelRatio。視窗大小改變時重畫 */
    resize(w, h, pr) {
      canvas.width = Math.max(1, Math.round(w * pr)); canvas.height = Math.max(1, Math.round(h * pr));
      draw(canvas.getContext('2d'), canvas.width, canvas.height, pr);
      texture.dispose();                    // 尺寸變了，讓 three.js 重新配置貼圖
      texture.needsUpdate = true;
    },
  };
}
