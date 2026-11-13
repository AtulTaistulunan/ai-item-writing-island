import * as THREE from 'three';
import { M } from '../materials.js';
import { weaveMat } from '../textures.js';
import { mesh, cyl, sph } from './primitives.js';

/** 斗笠：掛在小木架上的竹編圓錐帽 */
export function bambooHat() {
  const g = new THREE.Group();
  g.userData.palette = { weave: '#e2c78c', white: '#c49a5c', dark: '#6b4a2e' };
  g.add(cyl(.05, .55, M.dark, 0, 0, 0));
  const hat = mesh(new THREE.ConeGeometry(.62, .32, 28, 1, true), weaveMat, 0, .72, 0); hat.rotation.z = .25; g.add(hat);
  g.add(sph(.05, M.white, -.04, .88, 0));
  return g;
}
