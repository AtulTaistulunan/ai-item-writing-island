import * as THREE from 'three';
import { M } from '../materials.js';
import { weaveMat } from '../textures.js';
import { PI, mesh, cyl, sph } from './primitives.js';

/** 桌罩：竹編半球罩在一盤飯菜上 */
export function foodCover() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#f3efe6', gray: '#e0a96d', weave: '#dcb979' };
  g.add(cyl(.42, .04, M.white, 0, 0, 0));
  g.add(sph(.12, M.gray, -.1, .1, .05), sph(.1, M.gray, .14, .08, -.05));
  g.add(mesh(new THREE.SphereGeometry(.4, 24, 12, 0, PI * 2, 0, PI / 2), weaveMat, 0, .04, 0));
  g.add(sph(.06, M.white, 0, .46, 0));
  return g;
}
