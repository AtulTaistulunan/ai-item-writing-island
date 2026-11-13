import * as THREE from 'three';
import { M } from '../materials.js';
import { weaveMat } from '../textures.js';
import { PI, mesh, box } from './primitives.js';

/** 背簍：上寬下窄的藤編簍子，背面兩條背帶 */
export function backBasket() {
  const g = new THREE.Group();
  g.userData.palette = { weave: '#dcb979', white: '#c49a5c', dark: '#6b4a2e' };
  g.add(mesh(new THREE.CylinderGeometry(.4, .27, .95, 20, 1, true), weaveMat, 0, .5, 0));
  g.add(mesh(new THREE.CylinderGeometry(.27, .27, .03, 20), M.white, 0, .04, 0));
  const rim = mesh(new THREE.TorusGeometry(.4, .04, 8, 24), M.white, 0, .97, 0); rim.rotation.x = PI / 2; g.add(rim);
  for (const x of [-.14, .14]) {
    const s = box(.07, .8, .03, M.dark, x, .15, -.37); s.rotation.x = .12; g.add(s);
  }
  return g;
}
