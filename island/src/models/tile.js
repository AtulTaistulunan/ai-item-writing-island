import * as THREE from 'three';
import { M } from '../materials.js';
import { numMat } from '../textures.js';
import { box } from './primitives.js';

/**
 * 頂面寫著編號的方柱（時光塔的台階、診斷塔的 25 題方塊共用）。
 * setTone('white' | 'gray' | 'accent') 換顏色；setHeight(h) 改高度（頂面編號不會被拉長）。
 */
export function tile(label, size = .8, height = 1) {
  const g = new THREE.Group();
  g.userData.noPaint = true;                          // 題號、輪次用黑白灰表達資料，不上色
  const inner = new THREE.Group(); g.add(inner);
  const body = box(size, 1, size, M.white); inner.add(body);
  const top = box(size, .02, size, M.white, 0, 0, 0); g.add(top);
  let h = height, want = height, tone = '';
  const side = { white: M.white, gray: M.gray, accent: M.accent };
  g.userData.setTone = t => {
    if (t === tone) return; tone = t;
    body.material = side[t]; top.material = [side[t], side[t], numMat(label, t), side[t], side[t], side[t]];
  };
  g.userData.setHeight = v => { want = v; };
  g.userData.height = () => want;                       // 目標高度（動畫結束後的高度）
  let pulse = 0;                                       // 被點選時短暫放大一下
  g.userData.pulse = () => { pulse = 1; };
  g.userData.update = ease => {
    h += (want - h) * ease;
    pulse = Math.max(0, pulse - ease * .35);
    const s = 1 + Math.sin(pulse * Math.PI) * .12;
    inner.scale.set(s, Math.max(h - .02, .01), s); top.position.y = h - .01; top.scale.set(s, 1, s);
  };
  g.userData.setTone('white'); g.userData.update(1);
  return g;
}
