import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, box, sph } from './primitives.js';

/** 海龜與旁邊的塑膠碎片（案例 06：證據與推論） */
export function turtle() {
  const g = new THREE.Group();
  g.userData.palette = { gray: '#6f8f5a', white: '#a9bb8b', dark: '#4fa0c8' };
  const shell = mesh(new THREE.SphereGeometry(.3, 20, 10, 0, PI * 2, 0, PI / 2), M.gray, 0, .06, 0);
  shell.scale.set(1, .6, 1.2); g.add(shell);
  g.add(sph(.1, M.white, 0, .12, .42));
  for (const [x, z, r] of [[-.3, .2, .5], [.3, .2, -.5], [-.25, -.25, -.4], [.25, -.25, .4]]) {
    const f = box(.22, .04, .1, M.white, x, .04, z); f.rotation.y = r; g.add(f);
  }
  for (const [x, z] of [[.45, .3], [.5, .05], [.38, -.2]]) {
    const p = box(.07, .03, .05, M.dark, x, 0, z); p.rotation.y = x * 7; g.add(p);
  }
  return g;
}
