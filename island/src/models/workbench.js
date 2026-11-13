import * as THREE from 'three';
import { M } from '../materials.js';
import { numMat } from '../textures.js';
import { box } from './primitives.js';

/**
 * 工作檯：檯面左邊放寫著案例編號的題目卡，右邊放這個案例考的器物（prop）。
 * setTone 換卡片顏色。
 */
export function workbench(label, prop = null) {
  const g = new THREE.Group();
  g.userData.palette = { white: '#b98b5e' };
  g.add(box(.1, .66, .6, M.white, -.68, 0, 0), box(.1, .66, .6, M.white, .68, 0, 0));
  g.add(box(1.5, .12, .7, M.white, 0, .66, 0));
  const card = box(.6, .04, .46, M.white, -.38, .78, 0); card.rotation.y = .1; card.userData.noPaint = true; g.add(card);
  if (prop) { prop.position.x += .38; prop.position.y += .78; g.add(prop); }
  let tone = '';
  g.userData.setTone = t => {
    if (t === tone) return; tone = t;
    const side = t === 'accent' ? M.accent : M.white;
    card.material = [side, side, numMat(label, t), side, side, side];
  };
  g.userData.setTone('white');
  return g;
}
