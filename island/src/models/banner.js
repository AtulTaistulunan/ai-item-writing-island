import * as THREE from 'three';
import { M } from '../materials.js';
import { box, cyl, sph } from './primitives.js';

/** 展覽館的旗桿與直立布旗。hoverParts：滑過時轉成強調色的部分 */
export function banner() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#cdc4b4', dark: '#4a4a4f', lit: '#d9a441' };
  g.add(cyl(.22, .12, M.white, 0, 0, 0));
  g.add(cyl(.045, 2.6, M.dark, 0, .12, 0));
  g.add(sph(.08, M.white, 0, 2.76, 0));
  const flag = box(.04, 1.2, .62, M.white, 0, 1.35, .33); g.add(flag);
  g.add(box(.05, .06, .66, M.dark, 0, 2.55, .33));
  flag.userData.role = 'lit';
  g.userData.hoverParts = [flag];
  return g;
}
