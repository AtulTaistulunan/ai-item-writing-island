import * as THREE from 'three';
import { M } from '../materials.js';
import { weaveMat } from '../textures.js';
import { PI, mesh, sph } from './primitives.js';

/** 魚筌：竹藤編的漏斗形捕魚器，橫躺著，旁邊有固定用的石頭 */
export function fishTrap() {
  const g = new THREE.Group();
  g.userData.palette = { weave: '#dcb979', white: '#c49a5c', gray: '#9aa0a2' };
  const body = mesh(new THREE.CylinderGeometry(.34, .1, 1.2, 20, 1, true), weaveMat, 0, .36, 0);
  body.rotation.z = PI / 2; g.add(body);
  const rim = mesh(new THREE.TorusGeometry(.34, .04, 8, 24), M.white, .6, .36, 0); rim.rotation.y = PI / 2; g.add(rim);
  const tail = mesh(new THREE.TorusGeometry(.1, .03, 6, 16), M.white, -.6, .36, 0); tail.rotation.y = PI / 2; g.add(tail);
  g.add(sph(.14, M.gray, .1, .1, .38), sph(.11, M.gray, -.3, .08, -.34));
  return g;
}
