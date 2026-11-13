import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, cyl } from './primitives.js';

/** 石臼與木杵：石臼裡立著一根杵，旁邊再躺一根（邵族杵音用長短不同的杵） */
export function mortar() {
  const g = new THREE.Group();
  g.userData.palette = { gray: '#a9a399', white: '#b48a5e', dark: '#3a3430' };
  g.add(cyl(.36, .5, M.gray, 0, 0, 0, .42));
  g.add(cyl(.26, .02, M.dark, 0, .5, 0));
  const p = cyl(.06, 1.35, M.white, 0, 0, 0); p.position.set(.05, .35, 0); p.rotation.z = -.12; g.add(p);
  const q = cyl(.055, 1.0, M.white, 0, 0, 0); q.position.set(.5, .06, .3); q.rotation.set(PI / 2, 0, .3); g.add(q);
  return g;
}
