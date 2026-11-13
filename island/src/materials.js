import * as THREE from 'three';

// 關掉色彩管理：顏色值直接輸出，畫面才會是純白／純灰／原色強調色。
// 必須在任何 THREE.Color 建立之前執行，所以放在這個最早被載入的模組頂端。
THREE.ColorManagement.enabled = false;

/* ---------- 配色 ----------
 * 規則：材質只用 MeshBasicMaterial，顏色只有白、灰、一個強調色。
 */
export const ACCENT = '#d4ee3a';
export const GRAY = '#d8d8d8';
export const INK = '#161616';            // 線稿顏色（描邊、標籤）

const mat = c => new THREE.MeshBasicMaterial({ color: c });
export const M = {
  white:  mat(0xffffff),
  accent: mat(ACCENT),
  dark:   mat(0x2a2a2a),
  gray:   mat(GRAY),
  shadow: mat(0xececec),
};
for (const [k, m] of Object.entries(M)) m.name = k;    // 上色（paint.js）用材質名稱查色票

// 平台底下的灰色影子放在這個 layer，描邊用的法線／深度 pass 只畫 layer 0，影子就不會被描邊。
export const SHADOW_LAYER = 1;
