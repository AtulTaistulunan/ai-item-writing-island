import * as THREE from 'three';
import { M } from '../materials.js';
import { box } from './primitives.js';

/** 一疊紙（題本） */
export function paperStack(n = 3) {
  const g = new THREE.Group();
  g.userData.palette = { white: '#f7f2e6' };
  for (let i = 0; i < n; i++) {
    const p = box(.62, .07, .46, M.white, 0, i * .07, 0); p.rotation.y = (i % 2 ? .12 : -.08); g.add(p);
  }
  return g;
}
