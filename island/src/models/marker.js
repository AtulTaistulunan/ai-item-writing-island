import * as THREE from 'three';
import { M } from '../materials.js';

/** 選取標記：倒立的方錐，浮在被選取的東西上方 */
export function marker() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(.3, 0, .55, 4), M.accent);
  cone.position.y = .28; g.add(cone); g.visible = false;
  g.userData.noPaint = true;                          // 選取標記維持強調色
  let baseY = 0;
  g.userData.at = (x, y, z) => { g.position.set(x, y, z); baseY = y; g.visible = true; };
  g.userData.hide = () => { g.visible = false; };
  g.userData.update = t => { g.position.y = baseY + Math.sin(t * 3) * .12; cone.rotation.y = t * 1.2; };
  return g;
}
