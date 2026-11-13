import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, cyl } from './primitives.js';

/** 放大鏡：鏡框（圓環）、灰色鏡片、握柄。鏡面朝本地 +z */
export function magnifier() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#c9a447', gray: '#bfe3ef', dark: '#7a5233' };
  g.add(mesh(new THREE.TorusGeometry(.55, .09, 12, 40), M.white));
  const glass = mesh(new THREE.CylinderGeometry(.5, .5, .04, 40), M.gray); glass.rotation.x = PI / 2; g.add(glass);
  const handle = cyl(.08, .8, M.dark, 0, 0, 0); handle.position.y = -1.05; g.add(handle);
  return g;
}
