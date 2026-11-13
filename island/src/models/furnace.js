import * as THREE from 'three';
import { M } from '../materials.js';
import { box, cyl } from './primitives.js';

/** 熔爐：爐身、爐口（裡面有會跳動的火）、煙囪 */
export function furnace() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#c4705a', upper: '#b0614d', chimney: '#8e8984', dark: '#2b2523', accent: '#f2913d', lit: '#ffb347' };
  g.add(box(2.2, 1.7, 2.2, M.white));
  const upper = box(1.6, .7, 1.6, M.white, 0, 1.7, 0); upper.userData.role = 'upper'; g.add(upper);
  const cap = cyl(.36, .16, M.dark, .3, 3.9, .3);                    // 煙囪口：滑過時亮起
  cap.userData.role = 'lit';
  const chimney = cyl(.32, 1.5, M.white, .3, 2.4, .3); chimney.userData.role = 'chimney';
  g.add(chimney, cap);
  g.userData.hoverParts = [cap];
  const fires = [];
  for (const [x, z, w, d] of [[0, 1.1, .9, .06], [1.1, 0, .06, .9]]) {
    g.add(box(w, .75, d, M.dark, x, .35, z));
    const f = box(w * (w > .1 ? .7 : 1.2), .4, d * (d > .1 ? .7 : 1.2), M.accent, x * 1.01, .38, z * 1.01);
    g.add(f); fires.push(f);
  }
  g.userData.update = t => fires.forEach((f, i) => { f.scale.y = .75 + Math.abs(Math.sin(t * 5 + i * 1.7)) * .4; });
  return g;
}
