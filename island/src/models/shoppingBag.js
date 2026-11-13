import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, box } from './primitives.js';

/** 可重複使用的購物袋，旁邊一個外帶餐盒 */
export function shoppingBag() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#d6c7a6', dark: '#6b4a2e', gray: '#bfe0e8' };
  g.add(box(.55, .6, .25, M.white, -.1, 0, 0));
  g.add(mesh(new THREE.TorusGeometry(.14, .025, 6, 16, PI), M.dark, -.1, .6, 0));
  g.add(box(.36, .14, .28, M.gray, .32, 0, .2), box(.38, .03, .3, M.white, .32, .14, .2));
  return g;
}
