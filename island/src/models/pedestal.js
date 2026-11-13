import * as THREE from 'three';
import { M } from '../materials.js';
import { box } from './primitives.js';

/** 指標台座：白色底座 + 直立文字牌（面朝本地 +x）。setOn(true) 時台座頂面變強調色 */
export function pedestal(signOff, signOn) {
  const g = new THREE.Group();
  g.userData.palette = { white: '#d6cebf', dark: '#4a4a4f' };
  g.add(box(.9, .45, .9, M.white));
  const cap = box(.9, .08, .9, M.white, 0, .45, 0); g.add(cap);
  const plate = box(.06, .82, .82, M.white, 0, .7, 0); g.add(plate);
  cap.userData.noPaint = plate.userData.noPaint = true;   // 指標名稱與選取狀態維持黑白
  g.add(box(.06, .16, .12, M.dark, 0, .53, 0));
  g.userData.setOn = on => {
    cap.material = on ? M.accent : M.white;
    plate.material = [on ? signOn : signOff, M.white, M.white, M.white, M.white, M.white];
  };
  g.userData.setOn(false);
  return g;
}
