import * as THREE from 'three';
import { M } from '../materials.js';
import { cyl } from './primitives.js';

/** 寶特瓶 */
export function petBottle() {
  const g = new THREE.Group();
  g.userData.palette = { gray: '#a9dbe8', white: '#7fbf6a', dark: '#2f6fb0' };
  g.add(cyl(.17, .6, M.gray, 0, 0, 0));
  g.add(cyl(.175, .14, M.white, 0, .28, 0));                        // 標籤
  g.add(cyl(.06, .18, M.gray, 0, .6, 0, .17));
  g.add(cyl(.07, .08, M.dark, 0, .78, 0));
  return g;
}
