import * as THREE from 'three';
import { M } from '../materials.js';
import { box, cyl, sph } from './primitives.js';

/** 診斷塔：圓柱塔身、黑色腰帶、頂上燈室 */
export function lookoutTower() {
  const g = new THREE.Group();
  g.userData.palette = { white: '#f3efe8', plinth: '#cdc4b4', band: '#c0503f', roof: '#c0503f', door: '#7a5233', lit: '#ffd27a', accent: '#c9a447' };
  g.add(cyl(.95, .3, M.white, 0, 0, 0)).children.at(-1).userData.role = 'plinth';
  g.add(cyl(.62, 3.4, M.white, 0, .3, 0, .78));
  g.add(cyl(.66, .22, M.dark, 0, 2.3, 0)).children.at(-1).userData.role = 'band';
  g.add(box(.42, .7, .06, M.dark, 0, .3, .76)).children.at(-1).userData.role = 'door';   // 門
  g.add(cyl(.95, .16, M.white, 0, 3.7, 0));                          // 瞭望台
  const lamp = cyl(.5, .7, M.gray, 0, 3.86, 0); lamp.userData.role = 'lit'; g.add(lamp);   // 燈室：滑過時亮起
  g.userData.hoverParts = [lamp];
  g.add(cyl(0, .6, M.white, 0, 4.56, 0, .72)).children.at(-1).userData.role = 'roof';   // 屋頂
  g.add(sph(.12, M.accent, 0, 5.22, 0));
  return g;
}
