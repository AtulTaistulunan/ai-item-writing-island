import * as THREE from 'three';
import { M } from '../materials.js';
import { box, cyl } from './primitives.js';

/** 砧板與菜刀 */
export function cuttingBoard() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#c49a6c', gray: '#b9c0c6', dark: '#3a2a1f' };
  g.add(cyl(.45, .16, M.white, 0, 0, 0));
  const blade = box(.42, .02, .16, M.gray, .05, .16, .05); blade.rotation.y = .5; g.add(blade);
  const handle = box(.18, .05, .07, M.dark, -.22, .16, .2); handle.rotation.y = .5; g.add(handle);
  return g;
}
