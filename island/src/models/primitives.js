import * as THREE from 'three';
import { M, SHADOW_LAYER } from '../materials.js';

/* 共用的小工具：所有模型都由這些基本形狀拼起來 */
export const PI = Math.PI;

export function mesh(geo, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); return o;
}
// box / cyl 的 y 是「底部高度」
export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z);
}
export function cyl(r, h, m, x = 0, y = 0, z = 0, rb = r, seg = 28) {
  return mesh(new THREE.CylinderGeometry(r, rb, h, seg), m, x, y + h / 2, z);
}
export function sph(r, m, x = 0, y = 0, z = 0) {
  return mesh(new THREE.SphereGeometry(r, 32, 20), m, x, y, z);
}
// 輪子（軸向 Z）
export function wheelZ(r, w, x, y, z) {
  const g = new THREE.Group();
  const t = mesh(new THREE.CylinderGeometry(r, r, w, 24), M.dark); t.rotation.x = PI / 2;
  const h = mesh(new THREE.CylinderGeometry(r * .45, r * .45, w + .03, 18), M.white); h.rotation.x = PI / 2;
  g.add(t, h); g.position.set(x, y, z); return g;
}
export function group(...kids) { const g = new THREE.Group(); kids.forEach(k => g.add(k)); return g; }
export function place(o, x, y, z, ry = 0, s = 1) {
  o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); return o;
}
// 平躺的灰色影子，放在 SHADOW_LAYER，不參與描邊
export function shadowMesh(geo, x, y, z) {
  const m = mesh(geo, M.shadow, x, y, z); m.rotation.x = -PI / 2; m.layers.set(SHADOW_LAYER); return m;
}
