import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh } from './primitives.js';

/** 瓢：剖半的葫蘆做成的勺子。傳入灰色材質就成了現代的塑膠水勺 */
export function gourdLadle(mat = M.white) {
  const g = new THREE.Group();
  g.userData.palette = { white: '#d9b86c', gray: '#7cc3d6', inner: '#f1e6c8' };
  g.add(mesh(new THREE.SphereGeometry(.3, 24, 12, 0, PI * 2, PI / 2, PI / 2), mat, 0, .3, 0));
  g.add(mesh(new THREE.CylinderGeometry(.3, .3, .02, 24), M.white, 0, .3, 0)).children.at(-1).userData.role = 'inner';
  const handle = mesh(new THREE.CylinderGeometry(.05, .07, .7, 12), mat, .5, .45, 0);
  handle.rotation.z = -1.1; g.add(handle);
  return g;
}
