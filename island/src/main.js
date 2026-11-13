import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import data from './data.js';
import { buildWorld } from './world.js';
import { createOutline } from './postprocess.js';
import { createLabels } from './labels.js';
import { createPanel } from './panel.js';
import { createStarChart } from './sky.js';

const PI = Math.PI;
const clamp = THREE.MathUtils.clamp;
const $ = s => document.querySelector(s);

/* ---------- 場景 ---------- */
const app = $('#app');
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const starChart = createStarChart();                     // 淺色星圖底圖
scene.background = starChart.texture;
const world = buildWorld(scene, data);
const { platforms } = world;

/* ---------- 相機：正交、等角，位在 target 的 (1,1,1) 方向 ---------- */
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
const HOME = new THREE.Vector3(0, 2.1, 0);
const HOME_DIR = new THREE.Vector3(1, 1, 1).normalize();
camera.position.copy(HOME).addScaledVector(HOME_DIR, 104);
camera.lookAt(HOME);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME);
controls.enablePan = false; controls.enableDamping = true;
controls.zoomToCursor = true;
controls.minZoom = .6; controls.maxZoom = 3;
controls.minPolarAngle = .6; controls.maxPolarAngle = 1.25;
controls.minAzimuthAngle = 0; controls.maxAzimuthAngle = PI / 2;
controls.rotateSpeed = .7;                                       // 旋轉不要太快
controls.update(); controls.saveState();

/* ---------- 描邊、標籤 ---------- */
const outline = createOutline(camera);
document.querySelector('.brand .tagline').textContent = data.curation.tagline;
const labels = createLabels(platforms, $('#overlay'), $('#leaders'), [$('.tools'), $('.brand')]);

/* ---------- 狀態 ----------
 * station：-1 全景，0 時光塔，1 診斷塔，2 鍛造坊，3 展覽館。其餘欄位是各站內的選取。
 */
const DONE_KEY = 'knowledge-island:done';
function loadDone() {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY)) || []); } catch { return new Set(); }
}
const state = {
  station: -1, round: 1, indicator: 'distractor', question: null, version: 'v1',
  kase: null, stage: 0, guess: null, compareQ: null, compareV: null, artifact: null, done: loadDone(),
};
const drawer = $('#drawer');
const panel = createPanel(drawer, set);
let hovered = -1;

function set(patch) {
  if (patch.finish) {
    state.done.add(patch.finish); delete patch.finish;
    try { localStorage.setItem(DONE_KEY, JSON.stringify([...state.done])); } catch { /* 無痕模式：只記在這次 */ }
  }
  const prev = state.station;
  Object.assign(state, patch);
  if (tour.on && state.station >= 0) tour.step = state.station;   // 導覽中自己換站：導覽跟著走
  panel.render(state);
  world.set({
    station: state.station,
    round: state.station === 0 ? state.round : 0,
    indicator: state.indicator,
    question: state.station === 1 ? state.question : null,
    kase: state.station === 2 ? state.kase : null,
    artifact: state.station === 3 ? state.artifact : null,
    done: state.done,
  });
  labels.setActive(hovered >= 0 ? hovered : state.station);
  labels.setTextHidden(state.station >= 0);
  document.body.classList.toggle('drawer-open', state.station >= 0);
  renderTour();
  // 導覽列與面板都擺好後才算鏡頭構圖，手機上才扣得到導覽列的高度
  if (state.station !== prev) flyTo(state.station);
}

/* ---------- 控制列 ---------- */
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pauseBtn = $('#pause');
const syncPause = () => {
  pauseBtn.textContent = paused ? '播放動畫' : '暫停動畫';
  pauseBtn.setAttribute('aria-pressed', paused);
};
pauseBtn.onclick = () => { paused = !paused; syncPause(); };
syncPause();
$('#overview').onclick = () => set({ station: -1 });
$('#resetView').onclick = () => { set({ station: -1 }); fly = { target: HOME.clone(), zoom: 1, dir: HOME_DIR.clone() }; };
$('#tourBtn').onclick = () => (tour.on ? endTour() : startTour());
const helpPop = $('#helpPop');
$('#help').onclick = () => { const on = helpPop.hidden; helpPop.hidden = !on; $('#help').setAttribute('aria-expanded', on); };
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!helpPop.hidden) { helpPop.hidden = true; return; }
  if (state.station >= 0) set({ station: -1 });
});

const coarse = matchMedia('(pointer: coarse)').matches;
const HINT = coarse ? '單指拖曳旋轉・雙指縮放・點擊建築探索' : '拖曳旋轉・滾輪縮放・點擊建築探索';
$('.hint').textContent = HINT;
$('#helpText').textContent = HINT;

/* ---------- 策展導覽 ----------
 * 依序走過四站，最後回到全景顯示結語。任何時候都能結束，回到自由探索。
 */
const tour = { on: false, step: 0 };
const tourEl = $('#tour');
const STOPS = data.stations.length;                               // 最後一步（= STOPS）是結語
function startTour() { tour.on = true; tour.step = 0; set({ station: 0 }); }
function endTour() { tour.on = false; set({ station: -1 }); }
function goTour(step) {
  tour.step = clamp(step, 0, STOPS);
  set({ station: tour.step < STOPS ? tour.step : -1 });
}
tourEl.addEventListener('click', e => {
  const b = e.target.closest('button[data-tour]');
  if (!b) return;
  ({ prev: () => goTour(tour.step - 1), next: () => goTour(tour.step + 1), end: endTour })[b.dataset.tour]();
});
function renderTour() {
  $('#tourBtn').textContent = tour.on ? '結束導覽' : '導覽模式';
  $('#tourBtn').setAttribute('aria-pressed', tour.on);
  tourEl.hidden = !tour.on;
  document.body.classList.toggle('touring', tour.on);
  if (!tour.on) return;
  const last = tour.step === STOPS, st = data.stations[tour.step];
  const dots = data.stations.map((x, i) => `<i class="${i === tour.step ? 'on' : i < tour.step ? 'past' : ''}"></i>`).join('') +
    `<i class="${last ? 'on' : ''}"></i>`;
  tourEl.classList.toggle('final', last);
  tourEl.innerHTML = `
    <div class="tdots" aria-hidden="true">${dots}</div>
    ${last
      ? `<p class="tkicker">導覽結語</p><p class="tquote">${data.curation.conclusion}</p>`
      : `<p class="tkicker">策展導覽・第 ${tour.step + 1} 站／共 ${STOPS} 站</p>
         <h3><span>${String(st.n).padStart(2, '0')}</span>${st.name}</h3><p>${st.label}</p>`}
    <div class="tbtns">
      <button type="button" data-tour="prev" aria-label="上一站" ${tour.step === 0 ? 'disabled' : ''}>←<span class="tlong"> 上一站</span></button>
      ${last ? '' : `<button type="button" class="primary" data-tour="next">${tour.step === STOPS - 1 ? '看結語' : '下一站'} →</button>`}
      <button type="button" data-tour="end" aria-label="${last ? '回到自由探索' : '結束導覽'}"><span class="tlong">${last ? '回到自由探索' : '結束導覽'}</span><span class="tshort">✕</span></button>
    </div>`;
}

/* ---------- 滑過／點選 ---------- */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
const tip = $('#tip');

/* ---------- 角色對話泡泡 ----------
 * 句子都從資料檔取，並標出來源：老師說的是對話紀錄裡的教師原話，機器人說的是 AI 原文，
 * 檢核員報的是教師勾選的統計，參觀者介紹的是整理歸納的器物說明。
 */
const bubble = $('#bubble');
const pickOne = (list, last) => { const pool = list.length > 1 ? list.filter(x => x.text !== last) : list; return pool[Math.floor(Math.random() * pool.length)]; };
const LINES = {
  teacher: () => data.rounds.filter(r => r.teacherFeedback).map(r => ({ cite: `教師原話・第 ${r.round} 輪`, text: r.teacherFeedback.split('\n')[0] })),
  robot: () => data.rounds.map(r => ({ cite: `AI 原文・第 ${r.round} 輪`, text: r.aiQuote })),
  inspector: () => data.indicators.map(ind => ({ cite: '教師勾選・初版統計', text: `「${ind.label}」：25 題裡有 ${data.stats[ind.key].pass} 題通過。` })),
  smith: () => [{ cite: '鍛造坊', text: state.done.size
    ? `六個案例你已經完成 ${state.done.size} 個，繼續來修題！`
    : '一次敲一下、修一題。點工作檯，一起來看六個修題案例！' }],
  visitor: () => data.artifacts.map(a => ({ cite: '整理歸納', text: `${a.name}：${a.desc}` })),
};
const NAMES = { teacher: '老師', robot: 'AI 小幫手', inspector: '檢核員', smith: '鐵匠', visitor: '參觀者' };
let lastLine = '', bubbleTimer = 0, lastChar = null;
function say(id, x, y) {
  const line = pickOne(LINES[id](), lastLine); lastLine = line.text;
  bubble.innerHTML = `<b>${NAMES[id]}</b><p></p><cite></cite>`;
  bubble.querySelector('p').textContent = line.text;
  bubble.querySelector('cite').textContent = line.cite;
  bubble.hidden = false;
  const r = bubble.getBoundingClientRect();
  const bx = Math.min(Math.max(8, x - r.width / 2), innerWidth - r.width - 8), by = Math.max(8, y - r.height - 22);
  bubble.style.transform = `translate(${bx}px, ${by}px)`;
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => { bubble.hidden = true; }, 4200);
  world.react(id);
}
/** 回傳 { idx: 平台編號, item: 平台上可點的東西 { kind, id } } */
function pickAt(x, y) {
  mouse.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  let o = ray.intersectObjects(platforms.map(p => p.g), true)[0]?.object, item = null;
  while (o && o.userData.idx === undefined) { item ??= o.userData.pick || null; o = o.parent; }
  return { idx: o ? o.userData.idx : -1, item };
}
// 手指比滑鼠粗：沒點中小物件時，在周圍 14px 內再找一次
const RING = [[14, 0], [-14, 0], [0, 14], [0, -14], [10, 10], [-10, 10], [10, -10], [-10, -10]];
function pick(e) {
  const p = pickAt(e.clientX, e.clientY);
  if (e.pointerType !== 'touch' || p.item) return p;
  for (const [dx, dy] of RING) {
    const q = pickAt(e.clientX + dx, e.clientY + dy);
    if (q.item && (p.idx < 0 || q.idx === p.idx)) return q;
  }
  return p;
}

const el = renderer.domElement;
el.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || down?.moved) { tip.hidden = true; return; }
  const p = pick(e);
  hovered = state.station >= 0 ? -1 : p.idx;                      // 進入平台後不再浮起
  el.style.cursor = p.idx >= 0 ? 'pointer' : '';
  labels.setActive(hovered >= 0 ? hovered : state.station);
  // 滑到角色身上：角色跳一下並說一句話（同一個角色要離開再回來才會再說）
  const charId = p.item?.kind === 'character' ? p.item.id : null;
  if (charId && charId !== lastChar) say(charId, e.clientX, e.clientY);
  lastChar = charId;
  if (charId) { tip.hidden = true; return; }
  // 全景時在游標旁提示可以點；進入平台後只在可點的物件上提示
  const text = state.station < 0 && p.idx >= 0 ? `點擊探索・${data.stations[p.idx].name}`
    : p.item && p.idx === state.station ? '點擊查看' : '';
  tip.hidden = !text;
  if (text) { tip.textContent = text; tip.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`; }
});
el.addEventListener('pointerleave', () => { hovered = -1; lastChar = null; tip.hidden = true; labels.setActive(state.station); });

// 按下到放開移動不超過 6px 才算點擊，拖曳旋轉時不會誤選
let down = null;
el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, moved: false }; });
addEventListener('pointermove', e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true; });
el.addEventListener('pointerup', e => {
  const click = down && !down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 6;
  down = null;
  if (!click) return;
  const { idx, item } = pick(e);
  if (idx < 0) { set({ station: -1 }); return; }
  if (item?.kind === 'character') say(item.id, e.clientX, e.clientY);   // 手機沒有滑過，點角色也會說話
  const patch = { station: idx };
  if (item?.kind === 'round') patch.round = item.id;
  if (item?.kind === 'indicator') patch.indicator = item.id;
  if (item?.kind === 'question') Object.assign(patch, { question: item.id, version: 'v1' });
  if (item?.kind === 'artifact') patch.artifact = item.id;
  if (item?.kind === 'case') Object.assign(patch, { kase: item.id, stage: 0, guess: null, compareQ: null, compareV: null });
  tip.hidden = true;
  set(patch);
});

/* ---------- 鏡頭移動 ----------
 * fly = { target, zoom, dir? }：每幀把 controls.target、zoom（和視角方向）往目標靠近，用指數緩動，不會跳動。
 * 使用者一開始拖曳或滾輪就取消，不跟使用者搶控制權。
 * 面板打開時，把平台放在面板以外那塊畫面的中央。
 */
let fly = null, interacting = false;
const shift = new THREE.Vector3(), axis = new THREE.Vector3(), offset = new THREE.Vector3();
controls.addEventListener('start', () => { fly = null; interacting = true; });
controls.addEventListener('end', () => { interacting = false; });

function drawerSize() {
  const r = drawer.getBoundingClientRect();
  if (W >= 760) return { w: (r.width || 420) + 12, h: 0, top: 0 };
  // 手機：面板在下方；導覽中還要再扣掉貼在面板上方的導覽列；上方扣掉標題區
  const bar = tour.on && !tourEl.hidden ? tourEl.getBoundingClientRect().height + 8 : 0;
  return { w: 0, h: Math.min(r.height || H * .56, H * .56) + bar, top: $('.brand').getBoundingClientRect().bottom };
}

function flyTo(idx) {
  if (idx < 0) { fly = { target: HOME.clone(), zoom: 1 }; return; }
  const c = platforms[idx].cfg, d = drawerSize();
  const viewW = camera.right - camera.left, viewH = camera.top - camera.bottom;
  const freeW = (W - d.w) / W, freeH = (H - d.h - d.top) / H;
  const zoom = clamp(Math.min(viewW * freeW * .86 / 13, viewH * freeH * .86 / 11.5), 1, controls.maxZoom);
  const target = new THREE.Vector3(c.x, c.h + 1.6, c.z);
  const perPx = viewW / zoom / W;                                  // 每個 CSS 像素對應的世界長度
  camera.updateMatrixWorld();
  // 平台要落在「沒被面板、導覽列、標題遮住」那塊區域的中央
  if (d.w) target.addScaledVector(axis.setFromMatrixColumn(camera.matrixWorld, 0), d.w / 2 * perPx);
  if (d.h || d.top) target.addScaledVector(axis.setFromMatrixColumn(camera.matrixWorld, 1), -(d.h - d.top) / 2 * perPx);
  fly = { target, zoom };
}

function moveCamera(dt) {
  const k = 1 - Math.exp(-dt * 5);
  if (fly) {
    shift.copy(fly.target).sub(controls.target);
    const far = shift.length(), dz = fly.zoom - camera.zoom;
    shift.multiplyScalar(k);
    controls.target.add(shift); camera.position.add(shift);
    camera.zoom += dz * k; camera.updateProjectionMatrix();
    let turn = 0;
    if (fly.dir) {                                                 // 重設視角：慢慢轉回 (1,1,1) 方向
      offset.copy(camera.position).sub(controls.target);
      const len = offset.length();
      offset.normalize(); turn = 1 - offset.dot(fly.dir);
      offset.lerp(fly.dir, k).normalize();
      camera.position.copy(controls.target).addScaledVector(offset, len);
    }
    if (far < .01 && Math.abs(dz) < .005 && turn < 1e-5) fly = null;
    return;
  }
  if (interacting || state.station >= 0) return;
  // 全景時縮回 zoom ≤ 1 就自動滑回中心；放大時不讓鏡頭跑到場景外
  shift.copy(controls.target).sub(HOME);
  const d = shift.length();
  if (d < .01) return;
  const want = camera.zoom <= 1.01 ? d * (1 - k) : Math.min(d, 12);
  if (want === d) return;
  shift.multiplyScalar(want / d - 1);
  controls.target.add(shift); camera.position.add(shift);
}

/* ---------- 尺寸 ---------- */
let W = 1, H = 1, PR = 1;
function resize() {
  W = innerWidth || 1; H = innerHeight || 1; PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR); renderer.setSize(W, H);
  starChart.resize(W, H, PR);
  outline.setSize(W * PR, H * PR);
  // 全景需要的可視範圍（世界單位）：手機只要求寬度塞得下，桌面版稍微收緊讓建築群大一點
  const aspect = W / H, needW = W < 760 ? 15.5 : 19.5, needH = W < 760 ? 12.5 : 12.6;
  const halfH = Math.max(needH, needW / aspect), halfW = halfH * aspect;
  Object.assign(camera, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
  camera.updateProjectionMatrix();
  labels.measure();
  if (state.station >= 0) flyTo(state.station);
}
addEventListener('resize', resize); resize();
set({});

/* ---------- 迴圈 ---------- */
const clock = new THREE.Clock();
let t = 0;
function frame(dt) {
  if (!paused) t += dt;                                            // 暫停時所有裝飾性動畫都停在原地
  moveCamera(dt);
  controls.update();
  world.animate(t, hovered, dt);

  // 線條粗細跟著場景在畫面上的大小縮放；上限 1.15，放大時小零件才不會被墨線填滿
  const pxPerUnit = H / (camera.top - camera.bottom) * camera.zoom;
  const lineScale = clamp(pxPerUnit / 36, .5, 1.15);
  outline.render(renderer, scene, camera, 1.4 * PR * lineScale);

  labels.update(camera, W, H);
}
function tick() {
  frame(Math.min(clock.getDelta(), .05));
  requestAnimationFrame(tick);
}
tick();
