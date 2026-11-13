import * as THREE from 'three';
import { M } from '../materials.js';
import { mesh, box, cyl, sph } from './primitives.js';

/** 人物：可站、坐、搬箱子、伸手、穿裙子。palette 可以覆蓋上色時的衣服等顏色 */
export function person(o = {}) {
  const { shirt = M.accent, pants = M.dark, hair = M.dark, carry = false, sit = false, reach = false, skirt = false } = o;
  const g = new THREE.Group();
  g.userData.palette = { skin: '#efc6a0', hair: '#3a2a1f', pants: '#3e4b5f', shirt: '#6f8fae', box: '#c9a26b', ...o.palette };
  const role = (m, r) => { m.userData.role = r; return m; };
  const ty = sit ? .55 : .72;
  if (sit) {
    g.add(role(box(.34, .14, .42, pants, 0, ty - .08, .2), 'pants'));
    g.add(role(box(.34, .5, .14, pants, 0, ty - .58, .4), 'pants'));
  } else if (skirt) {
    g.add(role(box(.1, .4, .12, M.white, -.08, 0, 0), 'skin'), role(box(.1, .4, .12, M.white, .08, 0, 0), 'skin'));
    g.add(role(cyl(.17, .36, shirt, 0, .38, 0, .32), 'shirt'));
  } else {
    g.add(role(box(.15, ty, .18, pants, -.1, 0, 0), 'pants'), role(box(.15, ty, .18, pants, .1, 0, 0), 'pants'));
  }
  g.add(role(mesh(new THREE.CapsuleGeometry(.19, .36, 6, 16), skirt ? M.white : shirt, 0, ty + .38, 0), 'shirt'));
  const armGeo = new THREE.CapsuleGeometry(.06, .4, 4, 10);
  const arms = [];                                     // [左, 右] 手臂轉軸：rotation.x 往負的方向是舉起來
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * .26, ty + .64, 0);
    pivot.add(role(mesh(armGeo, skirt ? M.white : shirt, 0, -.24, 0), 'shirt'));
    if (carry) pivot.rotation.x = -1.2;
    if (reach && s === 1) pivot.rotation.x = -2.3;
    g.add(pivot); arms.push(pivot);
  }
  g.userData.arms = arms;
  g.add(role(sph(.16, M.white, 0, ty + .95, 0), 'skin'));
  const hr = role(sph(.17, hair, 0, ty + 1.0, -.05), 'hair'); hr.scale.set(1, .8, 1); g.add(hr);
  if (carry) g.add(role(box(.5, .38, .4, M.accent, 0, ty + .35, .45), 'box'));
  return g;
}
