import * as THREE from 'three';
import { M, SHADOW_LAYER } from '../materials.js';

const dashGeo = new THREE.BoxGeometry(.3, .02, .07);
const SIZE = 9;                      // 平台邊長

/**
 * 參觀動線：兩個平台之間、沿著台階中線流動的細短線（強調色）。
 * 放在 SHADOW_LAYER，不進描邊用的法線／深度圖，所以不會被描上黑邊，看起來是一條細光線。
 * a、b 是平台設定 { x, z, h }；update(t) 讓短線從 a 流向 b。
 */
export function guidePath(a, b) {
  const g = new THREE.Group();
  const from = new THREE.Vector3(a.x, 0, a.z), to = new THREE.Vector3(b.x, 0, b.z);
  const dir = to.clone().sub(from).normalize();
  from.addScaledVector(dir, SIZE / 2 - .2); to.addScaledVector(dir, -(SIZE / 2 - .2));
  const len = from.distanceTo(to), N = 6, gap = len / N;
  const dashes = Array.from({ length: N }, () => {
    const d = new THREE.Mesh(dashGeo, M.accent);
    d.rotation.y = Math.atan2(-dir.z, dir.x); d.layers.set(SHADOW_LAYER); g.add(d); return d;
  });
  const p = new THREE.Vector3();
  g.userData.update = t => {
    const off = (t * .45) % gap;
    dashes.forEach((d, i) => {
      const s = (i * gap + off) / len;               // 0～1：在兩平台之間的位置
      p.lerpVectors(from, to, s);
      // 高度跟著台階：台階頂面在 a.h → b.h 之間線性變化
      d.position.set(p.x, THREE.MathUtils.lerp(a.h, b.h, s) + .04, p.z);
      d.scale.x = Math.min(1, Math.sin(s * Math.PI) * 2.2);          // 兩端淡出
    });
  };
  g.userData.update(0);
  return g;
}
