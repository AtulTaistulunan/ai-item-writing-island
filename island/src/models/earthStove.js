import * as THREE from 'three';
import { M } from '../materials.js';
import { brickMat } from '../textures.js';
import { PI, mesh, box, cyl } from './primitives.js';

/** 土灶：磚砌灶體、兩個灶口（一個放鍋）、正面柴火口和木柴。update(t) 讓火跳動 */
export function earthStove() {
  const g = new THREE.Group();
  g.userData.palette = { brick: '#e0957a', white: '#e4d7c4', dark: '#2b2523', accent: '#f2913d', iron: '#5a5d63', wood: '#9a6a43' };
  g.add(box(1.1, .6, .7, brickMat));
  g.add(box(1.14, .05, .74, M.white, 0, .6, 0));
  g.add(cyl(.2, .02, M.dark, -.25, .65, 0));
  const pot = mesh(new THREE.SphereGeometry(.24, 20, 10, 0, PI * 2, PI / 2, PI / 2), M.white, .25, .86, 0);
  const rim = cyl(.26, .04, M.white, .25, .84, 0);
  pot.userData.role = rim.userData.role = 'iron';
  g.add(pot, rim);
  g.add(box(.36, .26, .04, M.dark, 0, .1, .35));
  const fire = box(.22, .14, .02, M.accent, 0, .12, .37); g.add(fire);
  for (const [x, r] of [[-.05, .15], [.08, -.1]]) {
    const w = cyl(.04, .45, M.white, 0, 0, 0); w.rotation.set(PI / 2, 0, r); w.position.set(x, .05, .5); w.userData.role = 'wood'; g.add(w);
  }
  g.userData.update = t => { fire.scale.y = .7 + Math.abs(Math.sin(t * 6)) * .5; };
  return g;
}
