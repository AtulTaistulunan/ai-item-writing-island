import * as THREE from 'three';
import { M } from '../materials.js';
import { clockMat } from '../textures.js';
import { PI, mesh, box } from './primitives.js';

/** 鐘面：圓盤朝向本地 +z，時針、分針會轉 */
function clockFace() {
  const g = new THREE.Group();
  const disc = mesh(new THREE.CylinderGeometry(.66, .66, .08, 40), [M.white, clockMat, M.white]);
  disc.rotation.x = PI / 2; g.add(disc);
  const hands = [[.06, .36], [.04, .52]].map(([w, l]) => {
    const p = new THREE.Group(); p.position.z = .06;
    p.add(box(w, l, .03, M.dark, 0, 0, 0)); g.add(p); return p;
  });
  g.add(mesh(new THREE.CylinderGeometry(.07, .07, .06, 16), M.dark, 0, 0, .07)).children.at(-1).rotation.x = PI / 2;
  g.userData.update = t => { hands[0].rotation.z = -t * .08; hands[1].rotation.z = -t * .9; };
  return g;
}

/** 命題時光塔：塔身、兩面鐘、尖頂 */
export function clockTower() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#efe6d4', plinth: '#cdc4b4', roof: '#5b6f86', door: '#7a5233', lit: '#ffd27a', clock: '#fbf3df', dark: '#3a3632', accent: '#c9a447' };
  const plinth = box(2.4, .35, 2.4, M.white); plinth.userData.role = 'plinth'; g.add(plinth);
  g.add(box(1.9, 3.3, 1.9, M.white, 0, .35, 0));
  const door = box(.7, 1.1, .06, M.dark, 0, .35, .96); door.userData.role = 'door'; g.add(door);   // 門
  const windows = [];                                                // 窗：滑過時亮起
  for (const y of [1.9, 2.8]) {
    windows.push(box(.06, .55, .38, M.dark, .96, y, 0), box(.38, .55, .06, M.dark, -.45, y, .96), box(.38, .55, .06, M.dark, .45, y, .96));
  }
  windows.forEach(w => { w.userData.role = 'lit'; });                 // 上色時窗戶是暖黃燈光
  g.add(...windows);
  g.userData.hoverParts = windows;
  g.add(box(2.2, 1.6, 2.2, M.white, 0, 3.65, 0));
  const faces = [];
  for (const [x, z, ry] of [[0, 1.1, 0], [1.1, 0, PI / 2]]) {
    const f = clockFace(); f.position.set(x, 4.45, z); f.rotation.y = ry; g.add(f); faces.push(f);
  }
  const roof = mesh(new THREE.CylinderGeometry(0, 1.65, 1.3, 4), M.white, 0, 5.25 + .65, 0);
  roof.rotation.y = PI / 4; roof.userData.role = 'roof'; g.add(roof);
  g.add(mesh(new THREE.SphereGeometry(.16, 20, 12), M.accent, 0, 6.65, 0));
  g.userData.update = t => faces.forEach(f => f.userData.update(t));
  return g;
}
