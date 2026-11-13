import * as THREE from 'three';
import { M } from './materials.js';
import { signMat } from './textures.js';
import { PI, box, place } from './models/primitives.js';
import { platform } from './models/platform.js';
import { stairs } from './models/stairs.js';
import { person } from './models/person.js';
import { clockTower } from './models/clockTower.js';
import { robot } from './models/robot.js';
import { paperStack } from './models/paperStack.js';
import { tile } from './models/tile.js';
import { marker } from './models/marker.js';
import { lookoutTower } from './models/lookoutTower.js';
import { magnifier } from './models/magnifier.js';
import { pedestal } from './models/pedestal.js';
import { furnace } from './models/furnace.js';
import { anvil } from './models/anvil.js';
import { hammer } from './models/hammer.js';
import { workbench } from './models/workbench.js';
import { guidePath } from './models/guidePath.js';
import { banner } from './models/banner.js';
import { createPainter } from './paint.js';
import { fishTrap } from './models/fishTrap.js';
import { backBasket } from './models/backBasket.js';
import { mortar } from './models/mortar.js';
import { bambooHat } from './models/bambooHat.js';
import { foodCabinet } from './models/foodCabinet.js';
import { earthStove } from './models/earthStove.js';
import { foodCover } from './models/foodCover.js';
import { gourdLadle } from './models/gourdLadle.js';
import { cuttingBoard } from './models/cuttingBoard.js';
import { woodBucket } from './models/woodBucket.js';
import { leafParcel } from './models/leafParcel.js';
import { petBottle } from './models/petBottle.js';
import { plasticCup } from './models/plasticCup.js';
import { shoppingBag } from './models/shoppingBag.js';
import { takeoutBoxes } from './models/takeoutBoxes.js';
import { turtle } from './models/turtle.js';

/* 器物 id（island-data.json 的 artifacts）→ 模型與擺在展台上的縮放 */
const ARTIFACT_MODELS = {
  fishTrap: [fishTrap, .8], backBasket: [backBasket, .9], mortar: [mortar, .8], bambooHat: [bambooHat, .95],
  cabinet: [foodCabinet, .85], stove: [earthStove, .85], cover: [foodCover, 1.1], gourd: [() => gourdLadle(), .9],
  board: [cuttingBoard, 1.05], bucket: [woodBucket, 1.1], leaf: [leafParcel, 1.0],
  ladle: [() => gourdLadle(M.gray), .9], bottle: [petBottle, 1.05], cup: [plasticCup, 1.1], bag: [shoppingBag, 1.0],
  takeout: [takeoutBoxes, 1], turtle: [turtle, 1],
};
const makeArtifact = (id, k = 1) => { const [fn, s] = ARTIFACT_MODELS[id]; const o = fn(); o.scale.setScalar(s * k); return o; };

/* ---------- 四個平台 ----------
 * x, z：平台中心；h：高度。在 (1,1,1) 視角下：時光塔在上、診斷塔在右、鍛造坊在左、展覽館在下。
 * anchor：編號圓點在平台上的位置；dx, dy：標籤相對編號的位移（px）；m：手機專用位移
 */
const A = 6;
export const PLAT = [
  { key: 'tower', n: 1, x: -A, z: -A, h: 1.6, title: '命題時光塔', en: 'Authoring Timeline',
    text: '七輪對話：AI 出題、教師回饋、AI 修訂。點台階看每一輪改了什麼。',
    anchor: [-4.5, 0, 4.5], dx: -300, dy: -40, dot: 'right', m: { dx: -150, dy: -40 } },
  { key: 'diag', n: 2, x: A, z: -A, h: .8, title: '試題診斷塔', en: 'Item Diagnosis',
    text: '用四項指標檢核初版 25 題：答案全對，誘答性卻只有 2 題通過。',
    anchor: [4.5, 0, -4.5], dx: 24, dy: 84, dot: 'left', m: { dx: -96, dy: 70, dot: 'right' } },
  { key: 'forge', n: 3, x: -A, z: A, h: 0, title: '修題鍛造坊', en: 'Revision Forge',
    text: '六個代表案例：先自己找出命題問題，再看教師的回饋與 AI 的改寫。',
    anchor: [-4.5, 0, 4.5], dx: -280, dy: 70, dot: 'right', m: { dx: -30, dy: 70, dot: 'left' } },
  { key: 'museum', n: 4, x: A, z: A, h: -.6, title: '器物展覽館', en: 'Artifact Gallery',
    text: '題目裡考過的 15 件器物。點一件，看它出現在哪些題目、修訂後怎麼變。',
    anchor: [4.5, 0, 4.5], dx: 130, dy: -30, dot: 'left', m: { dx: 34, dy: 22 } },
];

/** 工作檯上的器物：一件放中間，多件縮小並排 */
function caseProp(ids) {
  const g = new THREE.Group();
  const k = ids.length > 1 ? .42 : .7;
  ids.forEach((id, i) => {
    const o = makeArtifact(id, k); o.position.z = (i - (ids.length - 1) / 2) * .26; o.position.x = (i % 2) * .08; g.add(o);
  });
  return g;
}

/** 把整座島加進 scene。data 是 island-data.json */
export function buildWorld(scene, data) {
  const platforms = PLAT.map((cfg, i) => {
    const st = data.stations.find(x => x.key === cfg.key);        // 標題、英文名、說明都從資料檔來
    Object.assign(cfg, { title: st.name, en: st.en, text: st.label });
    const { group: g, shadow } = platform(cfg);
    g.userData.idx = i;
    scene.add(g, shadow);
    return { g, cfg, lift: 0, phase: i * 1.9, hero: null, glow: 0 };
  });
  const P = Object.fromEntries(platforms.map(p => [p.cfg.key, p.g]));
  const cfgOf = Object.fromEntries(PLAT.map(c => [c.key, c]));
  const ups = [];                                          // 每幀要呼叫 update(t) 的東西
  const add = (g, o) => { g.add(o); if (o.userData.update) ups.push(o); return o; };
  const pickable = (o, pick) => { o.userData.pick = pick; return o; };
  // 島上的角色：滑過時跳一下、揮手（機器人轉一圈）。react(id) 觸發
  const chars = [];
  const character = (o, id) => {
    pickable(o, { kind: 'character', id });
    chars.push({ o, id, r: 1, y: o.position.y, ry: o.rotation.y, arm: o.userData.arms?.[0], armX: o.userData.arms?.[0]?.rotation.x });
    return o;
  };

  /* 命題時光塔：塔 + 七根台階（每一根是一輪對話） */
  const T = { tower: [-2.1, -2.1] };
  platforms[0].hero = add(P.tower, place(clockTower(), T.tower[0], 0, T.tower[1]));
  const steps = data.rounds.map((r, i) => {
    const phi = (-12 + i * 114 / 6) * PI / 180, R = 3.7;
    const s = tile(String(r.round), .85, .35 + i * .42);
    s.position.set(T.tower[0] + Math.sin(phi) * R, 0, T.tower[1] + Math.cos(phi) * R);
    P.tower.add(pickable(s, { kind: 'round', id: r.round }));
    s.userData.tone = r.fullText === 'summary' ? 'gray' : 'white';
    return s;
  });
  const teacher = place(person({ shirt: M.accent, reach: true, palette: { shirt: '#d08c60' } }), 3.7, 0, 2.4, -2.4);
  P.tower.add(character(teacher, 'teacher'));
  P.tower.add(character(place(robot(), 2.4, 0, 3.7, 2.3 - PI), 'robot'));
  P.tower.add(place(paperStack(4), 3.7, 0, 1.0, .3), place(paperStack(2), 3.6, 0, 3.8, -.2));
  const towerMark = add(P.tower, marker());

  /* 試題診斷塔：25 題方塊（初版題號）、四個指標台座、塔、移動的放大鏡 */
  platforms[1].hero = add(P.diag, place(lookoutTower(), -3.0, 0, -3.0));
  const cubes = data.questions.map((q, i) => {
    const c = tile(String(q.originalQuestionId), .74, 1);
    c.position.set(1.0 + (i % 5 - 2) * .95, 0, .8 + (Math.floor(i / 5) - 2) * .95);
    P.diag.add(pickable(c, { kind: 'question', id: q.originalQuestionId }));
    return c;
  });
  const peds = data.indicators.map((ind, i) => {
    const p = pedestal(signMat(ind.label, 'white'), signMat(ind.label, 'accent'));
    p.position.set(-3.4, 0, -1.25 + i * 1.45);
    P.diag.add(pickable(p, { kind: 'indicator', id: ind.key }));
    return p;
  });
  P.diag.add(character(place(person({ shirt: M.white, reach: true, palette: { shirt: '#5f7d96' } }), 3.6, 0, -2.4, -.6), 'inspector'));
  const lens = magnifier(); lens.rotation.x = -.9; P.diag.add(lens);
  const diagMark = add(P.diag, marker());

  /* 修題鍛造坊：熔爐、鐵砧、鐵匠、六張工作檯（每張一個案例） */
  platforms[2].hero = add(P.forge, place(furnace(), -2.7, 0, -2.7));
  const AV = [.5, .2];
  const desk = place(anvil(), AV[0], 0, AV[1], PI / 4); P.forge.add(desk);
  // 敲打時偶爾濺起的小光點（每三下一次）
  const sparks = [0, 1, 2].map(i => {
    const s = box(.07, .07, .07, M.accent); s.userData.dir = [Math.cos(i * 2.1) * .5, Math.sin(i * 2.1) * .5];
    s.visible = false; P.forge.add(s); return s;
  });
  const smith = place(person({ shirt: M.white, palette: { shirt: '#8b6b52' } }), AV[0] + .8, 0, AV[1] + .8, -3 * PI / 4);
  P.forge.add(character(smith, 'smith'));
  // 鐵鎚握在右手掌心：握柄順著手臂往下延伸，手臂一揮，鐵鎚就跟著敲到砧上
  const swingArm = smith.userData.arms[1];
  const ham = hammer(); ham.scale.setScalar(.75); ham.rotation.x = PI / 2; ham.position.set(0, -.46, .02);
  swingArm.add(ham);
  smith.userData.arms[0].rotation.x = -.5;                    // 另一隻手扶在前面
  const benches = data.cases.map((c, i) => {
    const phi = (-58 + i * 39) * PI / 180, R = 3.3;
    const b = place(workbench(c.id, caseProp(c.props)), AV[0] + Math.sin(phi) * R, 0, AV[1] + Math.cos(phi) * R, phi);
    P.forge.add(pickable(b, { kind: 'case', id: c.id }));
    return b;
  });
  const forgeMark = add(P.forge, marker());
  // 鍛造坊的地面與零件底色；鐵匠穿皮革圍裙色
  P.forge.userData.palette = { white: '#ebe1cf', gray: '#cbbfae', dark: '#3a3430', accent: '#ffb347' };

  /* 器物展覽館：4×4 展台。後三排是傳統器物（白台），最前排是現代器物（灰台），空位站一位參觀者 */
  const exhibits = data.artifacts.map((a, i) => {
    const slot = a.group === 'modern' ? 12 + data.artifacts.filter(x => x.group === 'modern').indexOf(a) : i;
    const x = -3 + (slot % 4) * 2, z = -3 + Math.floor(slot / 4) * 2;
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const base = a.group === 'modern' ? M.gray : M.white;
    const plinth = box(1.3, .28, 1.3, base); g.add(plinth);
    const cap = box(1.34, .06, 1.34, base, 0, .28, 0); g.add(cap);
    plinth.userData.noPaint = cap.userData.noPaint = true;      // 白台＝傳統、灰台＝現代，維持黑白灰
    const item = makeArtifact(a.id); item.position.y = .34; item.rotation.y = -PI / 4 + (i % 3 - 1) * .25; g.add(item);
    if (item.userData.update) ups.push(item);
    g.userData.setOn = on => { cap.material = on ? M.accent : base; };
    P.museum.add(pickable(g, { kind: 'artifact', id: a.id }));
    return g;
  });
  P.museum.add(character(place(person({ shirt: M.accent, palette: { shirt: '#7a9e7e' } }), 2.0, 0, 2.0, -2.6), 'visitor'));
  platforms[3].hero = P.museum.add(place(banner(), 3, 0, 1, -PI / 4)).children.at(-1);
  const museumMark = add(P.museum, marker());

  /* 台階：四個平台連成一圈 */
  scene.add(stairs(cfgOf.tower, cfgOf.diag), stairs(cfgOf.tower, cfgOf.forge),
    stairs(cfgOf.diag, cfgOf.museum), stairs(cfgOf.forge, cfgOf.museum));

  /* 參觀動線：台階中線上流動的細光線，沿 01 → 02 → 04 → 03 → 01 繞一圈 */
  const guides = [['tower', 'diag'], ['diag', 'museum'], ['museum', 'forge'], ['forge', 'tower']]
    .map(([a, b]) => { const g = guidePath(cfgOf[a], cfgOf[b]); scene.add(g); return g; });

  /* 線稿上色：各區地面底色，之後每一區建立自己的上色器 */
  P.tower.userData.palette = { white: '#e7e2d7', gray: '#c9c3b6', dark: '#3a3632' };
  P.diag.userData.palette = { white: '#e2e8ea', gray: '#c3ccd0', dark: '#363b40' };
  P.museum.userData.palette = { white: '#ece5d8', gray: '#cbc2b2', dark: '#3a3430' };
  platforms.forEach(p => { p.painter = createPainter(p.g); });

  /* ---------- 由 UI 狀態驅動的外觀 ---------- */
  const qIndex = Object.fromEntries(data.questions.map((q, i) => [q.originalQuestionId, i]));
  const view = { station: -1, round: 0, indicator: null, question: null, kase: null, artifact: null, done: new Set() };
  const prevSel = {};

  function sync() {
    // 選取改變時：台階／方塊短暫放大一下；換案例時工作臺上的卡片翻轉一次
    if (view.round && view.round !== prevSel.round) steps[data.rounds.findIndex(r => r.round === view.round)].userData.pulse();
    if (view.question && view.question !== prevSel.question) cubes[qIndex[view.question]].userData.pulse();
    if (view.kase && view.kase !== prevSel.kase) desk.userData.flip();
    Object.assign(prevSel, { round: view.round, question: view.question, kase: view.kase });

    steps.forEach((s, i) => s.userData.setTone(data.rounds[i].round === view.round ? 'accent' : s.userData.tone));
    const si = data.rounds.findIndex(r => r.round === view.round);
    if (si >= 0) { const s = steps[si]; towerMark.userData.at(s.position.x, s.userData.height() + .55, s.position.z); }
    else towerMark.userData.hide();

    cubes.forEach((c, i) => {
      const q = data.questions[i];
      // 'all'：四項總覽，每少通過一項就矮一截
      const fails = view.indicator === 'all' ? data.indicators.filter(ind => !q.qualityIndicators[ind.key]).length
        : view.indicator ? +!q.qualityIndicators[view.indicator] : 0;
      const pass = fails === 0;
      c.userData.setHeight(view.indicator === 'all' ? 1.05 - fails * .25 : pass ? 1.05 : .4);
      c.userData.setTone(q.originalQuestionId === view.question ? 'accent' : pass ? 'white' : 'gray');
    });
    peds.forEach((p, i) => p.userData.setOn(data.indicators[i].key === view.indicator));
    if (view.question != null) {
      const c = cubes[qIndex[view.question]];
      diagMark.userData.at(c.position.x, c.userData.height() + .55, c.position.z);
    } else diagMark.userData.hide();

    benches.forEach((b, i) => b.userData.setTone(view.done.has(data.cases[i].id) || data.cases[i].id === view.kase ? 'accent' : 'white'));
    const bi = data.cases.findIndex(c => c.id === view.kase);
    if (bi >= 0) forgeMark.userData.at(benches[bi].position.x, 1.35, benches[bi].position.z);
    else forgeMark.userData.hide();

    exhibits.forEach((e, i) => e.userData.setOn(data.artifacts[i].id === view.artifact));
    const ei = data.artifacts.findIndex(a => a.id === view.artifact);
    if (ei >= 0) museumMark.userData.at(exhibits[ei].position.x, 1.9, exhibits[ei].position.z);
    else museumMark.userData.hide();
  }
  sync();

  /* ---------- 每幀更新 ---------- */
  function animate(t, hovered, dt = 1 / 60) {
    const ease = 1 - Math.pow(.88, dt * 60);   // 與螢幕更新率無關
    platforms.forEach((p, i) => {
      p.lift += ((i === hovered ? .45 : 0) - p.lift) * ease;
      p.g.position.y = p.cfg.h + Math.sin(t * .9 + p.phase) * .07 + p.lift;
      // 滑過或選取中：建築細部轉成強調色、建築本身微微放大
      const on = i === hovered || i === view.station;
      p.glow += ((on ? 1 : 0) - p.glow) * ease;
      p.hero.scale.setScalar(1 + p.glow * .03);
      if (p.painter) p.painter.set(p.glow);                       // 上色的區：整區淡入自然材質色
      else p.hero.userData.hoverParts.forEach(m => {             // 還沒上色的區：細部轉成強調色
        m.userData.base ??= m.material;
        m.material = p.glow > .5 ? M.accent : m.userData.base;
      });
    });
    ups.forEach(o => o.userData.update(t));
    guides.forEach(g => g.userData.update(t));
    cubes.forEach(c => c.userData.update(ease));
    steps.forEach(s => s.userData.update(ease));
    desk.userData.tick(dt);
    // 放大鏡在 25 個方塊上方繞圈
    lens.position.set(1.0 + Math.cos(t * .5) * 1.5, 2.6 + Math.sin(t * 1.3) * .1, .8 + Math.sin(t * .5) * 1.5);
    lens.rotation.y = PI / 4 + Math.sin(t * .5) * .2;
    // 鐵匠一下一下地敲
    const k = (t * 1.6) % 1;
    // 前 1/4 拍快速敲下（舉高 → 砧面），其餘時間慢慢舉回去
    swingArm.rotation.x = k < .25 ? THREE.MathUtils.lerp(-2.7, -1.28, (k / .25) ** 2)
      : THREE.MathUtils.lerp(-1.28, -2.7, THREE.MathUtils.smoothstep((k - .25) / .75, 0, 1));
    const life = (k - .25) / .4, strike = Math.floor(t * 1.6) % 3 === 0;
    sparks.forEach(s => {
      s.visible = strike && life > 0 && life < 1;
      if (!s.visible) return;
      s.position.set(desk.position.x + .3 + s.userData.dir[0] * life, 1.0 + Math.sin(life * PI) * .6, desk.position.z + .3 + s.userData.dir[1] * life);
      s.scale.setScalar(1 - life);
    });
    teacher.rotation.y = -2.4 + Math.sin(t * .8) * .08;   // 老師邊講邊微微轉身

    // 角色反應：1.1 秒內跳兩下；人揮手，機器人原地轉一圈
    chars.forEach(c => {
      if (c.r >= 1) return;
      c.r = Math.min(1, c.r + dt / 1.1);
      const done = c.r >= 1;
      c.o.position.y = c.y + (done ? 0 : Math.abs(Math.sin(c.r * PI * 2)) * .3 * (1 - c.r * .4));
      if (c.id === 'robot') c.o.rotation.y = c.ry + (done ? 0 : THREE.MathUtils.smoothstep(c.r, 0, .8) * PI * 2);
      else if (c.arm) {
        c.arm.rotation.x = done ? c.armX : -2.9;
        c.arm.rotation.z = done ? 0 : Math.sin(c.r * PI * 6) * .45;
      }
    });
  }

  return {
    platforms, animate,
    set(patch) { Object.assign(view, patch); sync(); },
    /** 角色被滑過或點到時的小反應 */
    react(id) { const c = chars.find(x => x.id === id); if (c && c.r >= 1) c.r = 0; },
  };
}
