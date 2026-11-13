import * as THREE from 'three';
import { M } from '../materials.js';
import { weaveMat } from '../textures.js';
import { box } from './primitives.js';

/** 菜櫥：四腳木櫥，門板是透氣的網格 */
export function foodCabinet() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#a8754a', weave: '#dcb979', dark: '#3a2a1f' };
  for (const [x, z] of [[-.32, -.18], [.32, -.18], [-.32, .18], [.32, .18]]) g.add(box(.06, .25, .06, M.white, x, 0, z));
  g.add(box(.8, .95, .46, M.white, 0, .25, 0));
  g.add(box(.32, .6, .02, weaveMat, -.18, .42, .235), box(.32, .6, .02, weaveMat, .18, .42, .235));
  g.add(box(.04, .12, .03, M.dark, -.04, .66, .25), box(.04, .12, .03, M.dark, .04, .66, .25));
  g.add(box(.86, .06, .52, M.white, 0, 1.2, 0));
  return g;
}
