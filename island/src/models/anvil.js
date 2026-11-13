import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, box } from './primitives.js';

/**
 * 中央修題工作臺：鐵砧上並排兩張題目卡，灰色是修訂前、強調色是修訂後。
 * flip() 讓「修訂後」那張卡翻轉一次，切換案例時用來表示「重新鍛造」。
 */
export function anvil() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#80868d', dark: '#4b4f55' };
  g.add(box(.75, .3, .6, M.dark));
  g.add(box(.42, .35, .36, M.white, 0, .3, 0));
  g.add(box(1.1, .3, .52, M.white, 0, .65, 0));
  const horn = mesh(new THREE.CylinderGeometry(0, .2, .5, 16), M.white, .8, .8, 0); horn.rotation.z = -PI / 2; g.add(horn);
  const before = box(.36, .04, .4, M.gray, -.3, .95, 0); before.userData.noPaint = true; g.add(before);   // 修訂前
  const pivot = new THREE.Group(); pivot.position.set(.12, .97, 0); pivot.userData.noPaint = true; g.add(pivot);
  pivot.add(box(.36, .04, .4, M.accent, 0, 0, 0));                  // 修訂後
  let k = 1;
  g.userData.flip = () => { k = 0; };
  g.userData.tick = dt => {
    if (k >= 1) return;
    k = Math.min(1, k + dt * 1.6);
    pivot.rotation.x = (1 - k) * PI * 2;
    pivot.position.y = .97 + Math.sin(k * PI) * .35;
  };
  return g;
}
