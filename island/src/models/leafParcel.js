import * as THREE from 'three';
import { M } from '../materials.js';
import { PI, mesh, box } from './primitives.js';

const leafShape = new THREE.Shape();
leafShape.moveTo(0, -.55); leafShape.quadraticCurveTo(.3, 0, 0, .55); leafShape.quadraticCurveTo(-.3, 0, 0, -.55);
const leafGeo = new THREE.ShapeGeometry(leafShape, 12);

/** 月桃葉包的食物與竹葉粽：兩片大葉子、一個綁繩的葉包、兩顆粽子 */
export function leafParcel() {
  const g = new THREE.Group();
  g.userData.palette = { gray: '#7ea366', white: '#93b874', dark: '#6b4a2e' };
  for (const [x, r] of [[-.2, .4], [.15, -.3]]) {
    const l = mesh(leafGeo, M.gray, x, .02, 0); l.rotation.set(-PI / 2, 0, r); g.add(l);
  }
  g.add(box(.36, .16, .24, M.gray, -.15, .03, .05));
  g.add(box(.04, .17, .26, M.dark, -.15, .03, .05));
  for (const [x, z] of [[.25, -.15], [.32, .2]]) {
    const zz = mesh(new THREE.TetrahedronGeometry(.17), M.white, x, .14, z); zz.rotation.set(.6, .3, .9); g.add(zz);
  }
  return g;
}
