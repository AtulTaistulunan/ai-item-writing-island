import * as THREE from 'three';
import { M } from '../materials.js';
import { box, cyl, sph } from './primitives.js';

/** AI 小機器人：方頭、天線，頭會輕輕上下 */
export function robot() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#dfe5ea', gray: '#8fb3c9', dark: '#4a525a', accent: '#e86f4f' };
  g.add(cyl(.07, .5, M.dark, -.14, 0, 0), cyl(.07, .5, M.dark, .14, 0, 0));
  g.add(box(.62, .62, .42, M.white, 0, .5, 0));
  g.add(box(.3, .16, .03, M.gray, 0, .78, .22));                   // 胸前面板
  for (const s of [-1, 1]) {
    const arm = box(.1, .46, .12, M.white, s * .38, .58, 0); arm.rotation.z = s * .15; g.add(arm);
  }
  const head = new THREE.Group(); head.position.y = 1.2; g.add(head);
  head.add(box(.56, .4, .44, M.white, 0, 0, 0));
  head.add(box(.09, .09, .03, M.dark, -.12, .2, .22), box(.09, .09, .03, M.dark, .12, .2, .22));
  head.add(cyl(.02, .25, M.dark, 0, .4, 0), sph(.07, M.accent, 0, .7, 0));
  g.userData.update = t => { head.position.y = 1.2 + Math.abs(Math.sin(t * 2.2)) * .05; head.rotation.y = Math.sin(t * .7) * .25; };
  return g;
}
