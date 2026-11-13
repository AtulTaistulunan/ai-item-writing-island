import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, cyl } from './primitives.js';

/** 木水桶：兩道黑色鐵箍、提把 */
export function woodBucket() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#b98455', dark: '#4a4a4f', gray: '#8cc0d2' };
  g.add(cyl(.32, .58, M.white, 0, 0, 0, .27));
  g.add(cyl(.316, .05, M.dark, 0, .44, 0), cyl(.286, .05, M.dark, 0, .1, 0));
  g.add(cyl(.28, .01, M.gray, 0, .58, 0));
  g.add(mesh(new THREE.TorusGeometry(.32, .025, 6, 20, PI), M.white, 0, .58, 0));
  return g;
}
