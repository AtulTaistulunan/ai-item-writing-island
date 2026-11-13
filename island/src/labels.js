import * as THREE from 'three';
import { INK } from './materials.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* ---------- 編號標籤（HTML 疊在畫面上） ----------
 * 每個平台：圓形編號 + 標題說明 + SVG 引線。
 * platforms 的每一項需要 { cfg: { n, x, h, z, anchor, title, en, text, dx, dy, dot }, lift }
 * obstacles：不能被標籤蓋到的 HTML 元素（例如控制面板）
 */
export function createLabels(platforms, overlay, svg, obstacles = []) {
  const items = platforms.map(p => {
    const c = p.cfg;
    const num = Object.assign(document.createElement('div'), { className: 'num', textContent: String(c.n).padStart(2, '0') });
    const label = document.createElement('div'); label.className = 'label';
    label.innerHTML = `<h3>${c.title}</h3><div class="en">${c.en}</div><p>${c.text}</p>`;
    const line = document.createElementNS(SVG_NS, 'polyline');
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', INK); line.setAttribute('stroke-width', '1.5');
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', '3.5'); dot.setAttribute('fill', INK);
    svg.append(line, dot); overlay.append(label, num);
    return { p, num, label, h3: label.querySelector('h3'), line, dot, lw: 0, lh: 0, hw: 0, hh: 0, numOn: true, textOn: true };
  });

  // 尺寸只在版面改變時量一次，避免每一幀都強制瀏覽器重新排版
  let rects = [], textHidden = false, topSafe = 70;
  function measure() {
    for (const it of items) {
      it.lw = it.label.offsetWidth; it.lh = it.label.offsetHeight;
      it.hw = it.h3.offsetWidth; it.hh = it.h3.offsetHeight;
    }
    rects = obstacles.map(el => el.getBoundingClientRect());
    topSafe = 70;
  }
  measure();
  if (document.fonts) document.fonts.ready.then(measure);

  // 用 visibility 而不是 display，隱藏時仍量得到尺寸
  function showNum(it, on) {
    if (it.numOn === on) return;
    it.numOn = on; it.num.style.visibility = on ? '' : 'hidden';
  }
  function showText(it, on) {
    if (it.textOn === on) return;
    it.textOn = on;
    const v = on ? '' : 'hidden';
    it.label.style.visibility = v; it.line.style.visibility = v; it.dot.style.visibility = v;
  }

  const v3 = new THREE.Vector3();
  function update(camera, W, H) {
    const small = W < 760, k = small ? .55 : 1;
    const placed = [];                                 // 這一幀已經擺好的標籤，後面的標籤不能疊上去
    for (const it of items) {
      const cfg = it.p.cfg;
      // 用平台的「靜止位置 + 滑過浮起量」，編號和引線就不會跟著平台上下漂浮而晃動
      v3.set(cfg.x + cfg.anchor[0], cfg.h + it.p.lift + cfg.anchor[1], cfg.z + cfg.anchor[2]).project(camera);
      const x = (v3.x * .5 + .5) * W, y = (-v3.y * .5 + .5) * H;

      // 放大後跑出畫面的平台，標籤整組隱藏
      const on = x > -10 && x < W + 10 && y > -10 && y < H + 10;
      showNum(it, on);
      if (!on) { showText(it, false); continue; }

      it.num.style.left = x + 'px'; it.num.style.top = y + 'px';
      const m = small && cfg.m;                        // 手機專用位移
      const side = (m && m.dot) || cfg.dot;
      const wx = x + (m ? m.dx : cfg.dx * k), wy = y + (m ? m.dy : cfg.dy * k);   // 理想位置
      let bx = Math.max(12, Math.min(W - it.lw - 12, wx)), by = Math.max(topSafe, Math.min(H - it.lh - 12, wy));
      // 為了塞進畫面得挪太遠，代表旁邊沒有空位（通常是放大時）：只留編號，不硬擠文字去蓋住模型
      const fits = !textHidden && Math.abs(bx - wx) <= 140 && Math.abs(by - wy) <= 50;
      showText(it, fits);
      if (!fits) continue;
      // 避開控制面板：往比較近的那一側（上或下）推開
      for (const r of rects) {
        if (bx < r.right + 8 && bx + it.lw > r.left - 8 && by < r.bottom + 8 && by + it.lh > r.top - 8) {
          const down = r.bottom + 14, up = r.top - it.lh - 14;
          by = (up < topSafe || Math.abs(down - by) < Math.abs(up - by)) ? down : up;
        }
      }
      // 跟前面的標籤重疊：只留編號，不讓文字疊在一起
      const rect = { l: bx - 6, t: by - 6, r: bx + it.lw + 6, b: by + it.lh + 6 };
      if (placed.some(o => rect.l < o.r && rect.r > o.l && rect.t < o.b && rect.b > o.t)) { showText(it, false); continue; }
      placed.push(rect);
      it.label.style.left = bx + 'px'; it.label.style.top = by + 'px';
      const ty = by + it.hh / 2;
      const dx = side === 'left' ? bx - 12 : bx + it.hw + 12;
      const ex = dx + (side === 'left' ? -26 : 26);
      it.line.setAttribute('points', `${x},${y} ${ex},${ty} ${dx},${ty}`);
      it.dot.setAttribute('cx', dx); it.dot.setAttribute('cy', ty);
    }
  }

  function setActive(idx) {
    items.forEach((it, i) => {
      it.num.classList.toggle('active', i === idx);
      it.label.classList.toggle('active', i === idx);
    });
  }

  // 打開內容面板時只留編號，說明文字讓位給面板
  function setTextHidden(on) { textHidden = on; }

  return { update, setActive, measure, setTextHidden };
}
