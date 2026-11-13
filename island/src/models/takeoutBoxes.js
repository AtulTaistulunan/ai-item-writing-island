import * as THREE from 'three';
import { M } from '../materials.js';
import { box } from './primitives.js';

/** 一疊塑膠外帶盒（案例 05：餐飲店採購） */
export function takeoutBoxes() {
  const g = new THREE.Group();
  g.userData.palette = { gray: '#bfe0e8', white: '#f3efe6' };
  for (let i = 0; i < 4; i++) {
    const b = box(.42, .1, .3, i % 2 ? M.white : M.gray, 0, i * .11, 0); b.rotation.y = i % 2 ? .08 : -.05; g.add(b);
  }
  return g;
}
