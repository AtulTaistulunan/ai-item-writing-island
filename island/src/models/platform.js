import * as THREE from 'three';
import { M } from '../materials.js';
import { mesh, shadowMesh } from './primitives.js';

export const PLATFORM_SIZE = 9;

/** 浮空平台：頂面材質可換（例如地圖貼圖）。影子另外回傳，直接加到 scene，不跟平台一起浮動。 */
export function platform({ x, h, z }, topMat = M.white) {
  const g = new THREE.Group(); g.position.set(x, h, z);
  g.add(mesh(new THREE.BoxGeometry(PLATFORM_SIZE, .5, PLATFORM_SIZE),
    [M.white, M.white, topMat, M.white, M.white, M.white], 0, -.25, 0));
  const shadow = shadowMesh(new THREE.PlaneGeometry(PLATFORM_SIZE, PLATFORM_SIZE), x - .5, h - 2.2, z + .9);
  return { group: g, shadow };
}
