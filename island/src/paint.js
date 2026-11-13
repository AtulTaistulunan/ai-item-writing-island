import * as THREE from 'three';

/* ---------- 線稿上色 ----------
 * 全景時整座島是黑白線稿；滑過或選取某一區時，那一區淡入成自然材質色，黑色描邊保留。
 *
 * 顏色從哪裡來：每個網格往上找最近一層有 userData.palette 的物件，
 *   1. 先用網格自己的 userData.role（例如 'skin'、'wood'）查表
 *   2. 查不到再用材質名稱（'white'、'gray'、'dark'、'accent'、'weave'、'brick'）查表
 *   都查不到就維持原色。
 * userData.noPaint = true 的物件（連同子物件）一律不上色：題目方塊、台階、題目卡、選取標記這些
 * 用黑白灰表達資料意義的東西。
 *
 * 每一區複製自己的一份材質，所以改顏色不會影響其他區。貼圖材質（竹編、磚牆）上色時，
 * 白底會被染色、黑線維持黑色。
 */
export function createPainter(root) {
  const clones = new Map();                     // `${材質 uuid}|${色碼}` → { mat, from, to }
  const items = [];                             // { mesh, orig, painted }

  function lookup(o, m) {
    const role = o.userData.role, key = m.name;
    for (let a = o; a; a = a.parent) {
      const p = a.userData.palette;
      if (p) {
        if (role && p[role]) return p[role];
        if (key && p[key]) return p[key];
      }
      if (a === root) break;
    }
    return null;
  }
  function painted(m, hex) {
    const key = m.uuid + '|' + hex;
    if (!clones.has(key)) {
      const mat = m.clone();
      clones.set(key, { mat, from: m.color.clone(), to: new THREE.Color(hex) });
    }
    return clones.get(key).mat;
  }
  function skipped(o) {
    for (let a = o; a; a = a.parent) { if (a.userData.noPaint) return true; if (a === root) break; }
    return false;
  }

  root.traverse(o => {
    if (!o.isMesh || skipped(o)) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const out = list.map(m => { const hex = lookup(o, m); return hex ? painted(m, hex) : m; });
    if (out.every((m, i) => m === list[i])) return;
    items.push({ mesh: o, orig: o.material, painted: Array.isArray(o.material) ? out : out[0] });
  });

  let k = 0, on = false;
  return {
    /** v：0＝線稿，1＝全彩 */
    set(v) {
      v = v < .002 ? 0 : v;
      if (v === k) return;
      k = v;
      clones.forEach(c => c.mat.color.copy(c.from).lerp(c.to, k));
      if ((k > 0) !== on) {
        on = k > 0;
        items.forEach(it => { it.mesh.material = on ? it.painted : it.orig; });
      }
    },
  };
}
