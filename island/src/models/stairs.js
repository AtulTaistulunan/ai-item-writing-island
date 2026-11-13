import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, shadowMesh } from './primitives.js';

const capsuleShape = (() => {
  const s = new THREE.Shape(), L = 2.2, r = .27;
  s.moveTo(-L / 2 + r, -r); s.lineTo(L / 2 - r, -r); s.absarc(L / 2 - r, 0, r, -PI / 2, PI / 2, false);
  s.lineTo(-L / 2 + r, r); s.absarc(-L / 2 + r, 0, r, PI / 2, PI * 1.5, false); return s;
})();
const padGeo = new THREE.ExtrudeGeometry(capsuleShape, { depth: .2, bevelEnabled: false, curveSegments: 20 });
const padShadowGeo = new THREE.ShapeGeometry(capsuleShape, 20);

/** 兩個平台之間的三片浮空台階（含影子）。a、b 是平台設定 { x, z, h } */
export function stairs(a, b) {
  const g = new THREE.Group();
  const alongX = a.z === b.z;
  [.2, .5, .8].forEach(f => {
    const x = alongX ? THREE.MathUtils.lerp(a.x, b.x, .5) + (f - .5) * 2.4 * Math.sign(b.x - a.x) : a.x;
    const z = alongX ? a.z : THREE.MathUtils.lerp(a.z, b.z, .5) + (f - .5) * 2.4 * Math.sign(b.z - a.z);
    const y = THREE.MathUtils.lerp(a.h, b.h, f) - .2;
    const p = mesh(padGeo, M.white, x, y, z); p.rotation.x = -PI / 2; if (alongX) p.rotation.z = PI / 2; g.add(p);
    const s = shadowMesh(padShadowGeo, x - .2, y - 1.2, z + .45); if (alongX) s.rotation.z = PI / 2; g.add(s);
  });
  return g;
}
