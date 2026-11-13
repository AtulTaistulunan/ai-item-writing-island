import * as THREE from 'three';
import { M } from '../materials.js';
import { cyl } from './primitives.js';

/** 一次性塑膠杯，杯蓋插著吸管 */
export function plasticCup() {
  const g = new THREE.Group();
  g.userData.palette = { gray: '#e3edf0', white: '#f7f7f5', dark: '#e0574a' };
  g.add(cyl(.2, .55, M.gray, 0, 0, 0, .15));
  g.add(cyl(.22, .04, M.white, 0, .55, 0));
  const s = cyl(.025, .45, M.dark, 0, 0, 0); s.position.set(.05, .5, 0); s.rotation.z = -.2; g.add(s);
  return g;
}
