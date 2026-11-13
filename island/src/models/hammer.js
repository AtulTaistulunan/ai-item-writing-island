import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, box, cyl } from './primitives.js';

/** 鐵鎚：握柄沿本地 +z，pivot 在握柄末端 */
export function hammer() {
  const g = new THREE.Group();
  g.userData.palette = { wood: '#8a5a3b', dark: '#55595f' };
  const h = cyl(.045, .8, M.dark, 0, 0, 0); h.rotation.x = PI / 2; h.position.set(0, 0, .4); h.userData.role = 'wood'; g.add(h);
  g.add(box(.22, .22, .42, M.dark, 0, -.11, .82)).children.at(-1).rotation.x = PI / 2;
  return g;
}
