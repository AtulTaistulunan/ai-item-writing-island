import data, { question, round, kase, artifact, artifactsIn, feedbackFor, VERSION_NAME } from './data.js';

/* ---------- 內容面板（HTML 疊在畫面右側；手機在下方） ----------
 * 結構：編號＋中英文名稱 → 展區導言 → 展區互動內容 → 策展觀點 → 上一站／下一站、返回全景
 * 所有按鈕用 data-act / data-v 標記，點擊後呼叫 set(patch) 改狀態，由 main.js 統一重畫面板並更新 3D 場景。
 *
 * 證據等級用框線區分（配色只有白、灰、一個強調色，不能靠顏色分）：
 *   實線框＝教師原話　灰底＝AI 原文　虛線框＝整理歸納　左側強調色線＝策展觀點
 */
const STATIONS = data.stations;
const pad = n => String(n).padStart(2, '0');
const FULLTEXT = { complete: '有完整 25 題', summary: '只有修訂摘要', partial: '只有修訂的 4 題' };
const CASE_TYPES = data.cases.map(c => c.type);
const STAGES = ['原始試題', '問題診斷', '教師回饋與 AI 修訂', '修訂成果與專業反思'];
const FLOW = ['AI 生成', '教師檢視', '發現問題', '提出回饋', 'AI 修訂', '教師確認'];
const L = 'ABCD';
const ALL = { key: 'all', label: '四項總覽' };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const btn = (act, v, html, cls = '', extra = '') =>
  `<button type="button" class="${cls}" data-act="${act}" data-v="${esc(v)}" ${extra}>${html}</button>`;

const teacher = (cite, lines) =>
  `<blockquote class="ev ev-teacher"><cite>${cite}</cite>${[].concat(lines).map(l => `<p>${esc(l)}</p>`).join('')}</blockquote>`;
const ai = (cite, text) => `<blockquote class="ev ev-ai"><cite>${cite}</cite><p>${esc(text)}</p></blockquote>`;
const derived = (cite, html) => `<div class="ev ev-derived"><cite>${cite}</cite>${html}</div>`;
const pending = text => `<div class="ev ev-pending"><cite>待補</cite><p>${esc(text)}</p></div>`;
const insight = (title, text) => `<aside class="insight"><cite>${title}</cite><p>${esc(text)}</p><small>${esc(data.curation.source)}</small></aside>`;

function table(t) {
  return `<table class="qt"><thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

/** 一道題目：題幹（必要時插入表格）＋四個選項，正確答案加粗並標「答」 */
function renderQ(v, showAnswer = true) {
  const [pre, post] = v.stem.split('\n');
  const stem = `<p>${esc(pre)}</p>${v.table ? table(v.table) : ''}${post ? `<p>${esc(post)}</p>` : ''}`;
  const opts = v.options.map((o, i) => {
    const on = showAnswer && L[i] === v.answer;
    return `<li class="${on ? 'ans' : ''}"><b>（${L[i]}）</b>${esc(o)}${on ? '<span class="tag">答</span>' : ''}</li>`;
  }).join('');
  return `<div class="q">${stem}<ol class="opts">${opts}</ol></div>`;
}

/** 這一題初版沒通過的指標（教師勾選）＋各輪回饋被歸納出的問題類型 */
function diagnosisTags(q) {
  const failed = data.indicators.filter(ind => !q.qualityIndicators[ind.key]);
  const kinds = [...new Set(feedbackFor(q).flatMap(f => f.labels))];
  return `<div class="tags">
    ${failed.length ? failed.map(ind => `<span class="dtag fail">✗ ${esc(ind.label)}</span>`).join('') : '<span class="dtag ok">四項指標皆通過</span>'}
    ${kinds.map(k => `<span class="dtag derived">${esc(k)}</span>`).join('')}
  </div>
  <p class="small muted">實線標籤是教師對初版的勾選；虛線標籤是從各輪教師回饋整理歸納的問題類型。</p>`;
}

/* ---------------- 01 命題時光塔 ---------------- */
function towerView(s) {
  const r = round(s.round), next = round(s.round + 1);
  const steps = data.rounds.map(x => btn('round', x.round,
    `<b>${x.round}</b><small>${x.round === 1 ? '初版' : x.round === 7 ? '第七版' : `第${'二三四五六'[x.round - 2]}版`}</small>`,
    `step ${x.fullText === 'summary' ? 'summary' : ''} ${x.round === s.round ? 'on' : ''}`,
    `aria-pressed="${x.round === s.round}"`)).join('');

  const issues = r.issues.length ? `<ul class="issues">${r.issues.map(i => `<li><b>${esc(i.label)}</b>${
    i.refs.map(ref => btn('question', ref.originalQuestionId,
      `第${ref.statedNo}題${ref.statedNo !== ref.originalQuestionId ? `<small>＝初版${ref.originalQuestionId}</small>` : ''}${ref.inferred ? '<small>（推定）</small>' : ''}`,
      'chip')).join('') || '<span class="muted">整份題本</span>'}</li>`).join('')}</ul>
    <p class="small muted">${esc(r.numberingNote)}。點題號可以到診斷塔看那一題。</p>` : '';

  // 每一輪依「教師檢視 → 發現問題 → AI 修訂 → 教師再檢視」排列
  const blocks = [
    r.round === 1
      ? ['教師提出需求', teacher('教師原話・出題指令', r.teacherPrompt)]
      : ['教師檢視並提出回饋', teacher(`教師原話・對第 ${r.round - 1} 版的回饋`, r.teacherFeedback.split('\n'))],
    r.issues.length ? ['發現的問題', derived(`整理歸納・這一輪點名 ${r.questionCount} 題`, issues)] : null,
    [r.round === 1 ? 'AI 生成初稿' : 'AI 依回饋修訂', ai('AI 原文・回覆開頭', r.aiQuote) +
      `<p class="meta">產出：${esc(r.version)}・PDF 第 ${r.pages[0]}–${r.pages[1]} 頁<span class="badge ${r.fullText}">${FULLTEXT[r.fullText]}</span></p>`],
    ['教師再檢視', next
      ? teacher(`教師原話・第 ${next.round} 輪回饋的開頭`, next.teacherFeedback.split('\n')[0]) +
        btn('round', next.round, `看第 ${next.round} 輪 →`, 'chip')
      : pending('對話紀錄在第七輪結束，沒有教師確認採用第七版的紀錄。')],
  ].filter(Boolean);

  return `
    <div class="flowbar">${FLOW.map(f => `<span>${f}</span>`).join('')}</div>
    <div class="stepper">${steps}</div>
    <p class="small muted">白色台階留有題目全文，灰色台階只留下修訂摘要。</p>
    <section class="card">
      <h3>第 ${r.round} 輪｜${esc(r.version)}</h3>
      <ol class="process">${blocks.map(([h, html]) => `<li><h4>${h}</h4>${html}</li>`).join('')}</ol>
      <div class="nav">
        ${btn('round', r.round - 1, '← 上一輪', 'ghost', r.round === 1 ? 'disabled' : '')}
        ${btn('round', r.round + 1, '下一輪 →', 'ghost', r.round === 7 ? 'disabled' : '')}
      </div>
    </section>`;
}

/* ---------------- 02 試題診斷塔 ---------------- */
function passOf(q, key) {
  return key === 'all' ? data.indicators.every(ind => q.qualityIndicators[ind.key]) : q.qualityIndicators[key];
}
function diagView(s) {
  const all = s.indicator === 'all';
  const st = all
    ? { pass: data.questions.filter(q => passOf(q, 'all')).length, label: '全部四項指標' }
    : data.stats[s.indicator];
  const tabs = [ALL, ...data.indicators].map(ind => btn('indicator', ind.key,
    `${esc(ind.label)}${ind.key === 'all' ? '' : `<small>${data.stats[ind.key].pass}/25</small>`}`, `tab ${ind.key === s.indicator ? 'on' : ''}`,
    `aria-pressed="${ind.key === s.indicator}"`)).join('');
  const grid = data.questions.map(q => {
    const pass = passOf(q, s.indicator);
    const fails = data.indicators.filter(ind => !q.qualityIndicators[ind.key]).length;
    return btn('question', q.originalQuestionId, `${q.originalQuestionId}${all && fails ? `<small>−${fails}</small>` : ''}`,
      `cell ${pass ? 'pass' : 'fail'} ${q.originalQuestionId === s.question ? 'on' : ''}`,
      `title="初版第 ${q.originalQuestionId} 題｜${esc(q.topic)}｜${pass ? '通過' : '未通過'}"`);
  }).join('');

  return `
    <div class="tabs">${tabs}</div>
    <div class="stat"><b>${st.pass}</b><span>／25 題通過「${esc(st.label)}」</span></div>
    <p class="small muted">${all
      ? '方塊越矮，代表沒通過的指標越多；格子上的「−n」是未通過的項數。'
      : '高的白色方塊是通過，矮的灰色方塊是未通過。'}這些是教師對初版的勾選，第六、七版沒有勾選資料。</p>
    <div class="grid25">${grid}</div>
    ${s.question ? questionCard(s) : '<p class="hint-box">點一個方塊，看那一題的診斷與從初版到最新版的變化。</p>'}`;
}

function questionCard(s) {
  const q = question(s.question);
  const vkeys = Object.keys(q.versions);
  const vk = vkeys.includes(s.version) ? s.version : 'v1';
  const v = q.versions[vk];
  const vtabs = vkeys.map(k => btn('version', k, `${VERSION_NAME[k]}<small>第${q.versions[k].no}題</small>`,
    `tab ${k === vk ? 'on' : ''}`, `aria-pressed="${k === vk}"`)).join('');
  const fb = feedbackFor(q).map(f => teacher(
    `教師原話・第 ${f.round} 輪（當時是第 ${f.statedNo} 題${f.inferred ? '，題號對應為推定' : ''}）`,
    f.lines.length ? f.lines : ['（這一輪的回饋提到整份題本，沒有單獨點名）'])).join('');
  const arts = artifactsIn(q.originalQuestionId);

  return `
    <section class="card">
      <h3>初版第 ${q.originalQuestionId} 題｜${esc(q.topic)}</h3>
      <p class="meta">第六版第 ${q.revisedQuestionId} 題${q.versions.v7 ? '・第七版再次修訂' : ''}${q.changeType === 'unchanged' ? '・題文沒有更動' : ''}</p>
      <h4>診斷標籤</h4>
      ${diagnosisTags(q)}
      <h4>題目</h4>
      <div class="tabs">${vtabs}</div>
      ${renderQ(v)}
      ${arts.length ? `<p class="small">考到的器物：${arts.map(a => btn('artifact', a.id, esc(a.name), 'chip')).join('')}</p>` : ''}
      <p class="small muted">出處：${esc(q.source[vk].file)} 第 ${q.source[vk].page} 頁</p>
      ${vk === 'v7' ? `<p class="warn">這是對話紀錄中最新的修訂稿，沒有資料顯示已正式採用。</p>${ai('AI 原文・修訂理由', v.aiRationale)}` : ''}
      ${q.revisionReason ? teacher('教師填寫・題目分析表的修正原因', q.revisionReason) : ''}
      ${fb ? `<h4>教師在對話中的回饋</h4>${fb}` : '<p class="small muted">對話中沒有教師點名這一題。</p>'}
    </section>`;
}

/* ---------------- 03 修題鍛造坊 ---------------- */
function compareBlock(s, qs) {
  const q = qs.find(x => x.originalQuestionId === s.compareQ) || qs[0];
  const later = Object.keys(q.versions).filter(k => k !== 'v1');
  const right = later.includes(s.compareV) ? s.compareV : q.latestVersion;
  const qtabs = qs.length > 1 ? `<div class="tabs">${qs.map(x => btn('compareQ', x.originalQuestionId, `初版第${x.originalQuestionId}題`,
    `tab ${x === q ? 'on' : ''}`)).join('')}</div>` : '';
  const vtabs = later.length > 1 ? `<div class="tabs">${later.map(k => btn('compareV', k, VERSION_NAME[k], `tab ${k === right ? 'on' : ''}`)).join('')}</div>` : '';
  return { q, html: `${qtabs}
    <div class="compare">
      <div><h4><span class="vtag before">修訂前</span>初版第 ${q.originalQuestionId} 題</h4>${renderQ(q.versions.v1)}</div>
      <div><h4><span class="vtag after">修訂後</span>${VERSION_NAME[right]}第 ${q.versions[right].no} 題</h4>${vtabs}${renderQ(q.versions[right])}
        ${right === 'v7' ? '<p class="warn">最新修訂稿，沒有資料顯示已正式採用。</p>' : ''}</div>
    </div>` };
}

function forgeView(s) {
  if (!s.kase) {
    return `
      <p class="lead">每個案例分四步：${STAGES.join(' → ')}。完成的工作檯會亮起來。</p>
      <div class="cases">${data.cases.map(c => btn('case', c.id,
        `<span class="cid">${c.id}</span><b>${esc(c.type)}</b><span>${esc(c.title)}</span>
         <small>初版第 ${c.originalQuestionIds.join('、')} 題${s.done.has(c.id) ? '・<em>已完成</em>' : ''}</small>`,
        `case-card ${s.done.has(c.id) ? 'done' : ''}`)).join('')}</div>`;
  }
  const c = kase(s.kase), qs = c.originalQuestionIds.map(question);
  const locked = i => i > 1 && s.guess == null;            // 先做出判斷，才能往後看答案
  const stages = STAGES.map((n, i) => `<li class="${i === s.stage ? 'on' : i < s.stage ? 'past' : ''}">${
    btn('stage', i, `<b>${i + 1}</b>${n}`, '', locked(i) ? 'disabled' : '')}</li>`).join('');
  let body = '';

  if (s.stage === 0) {
    body = `<p class="lead">先讀修訂前的題目和原本的答案，想想看哪裡可能有問題。</p>` +
      qs.map(q => `<h4>初版第 ${q.originalQuestionId} 題</h4>${renderQ(q.versions.v1)}`).join('');
  } else if (s.stage === 1) {
    const picked = s.guess;
    body = `<p class="lead">你覺得${qs.length > 1 ? '這組題目' : '這題'}最主要的命題問題是哪一種？</p>
      <div class="choices">${CASE_TYPES.map(t => btn('guess', t, esc(t),
        `choice ${picked === t ? 'picked' : ''} ${picked != null && t === c.type ? 'right' : ''}`, picked != null ? 'disabled' : '')).join('')}</div>
      ${picked == null ? '' : `${picked === c.type
        ? '<p class="result ok">答對了。</p>'
        : `<p class="result">這個案例的重點是「${esc(c.type)}」。你選的「${esc(picked)}」也可能存在。</p>`}
        ${qs.map(q => `<h4>初版第 ${q.originalQuestionId} 題的診斷</h4>${diagnosisTags(q)}`).join('')}`}`;
  } else if (s.stage === 2) {
    body = `<p class="small muted">修訂的分工：教師指出問題、提出修改要求；AI 依要求改寫；教師再檢查並決定是否選用。</p>` +
      qs.map(q => {
        const fb = feedbackFor(q).map(f => teacher(
          `教師原話・對話第 ${f.round} 輪（當時是第 ${f.statedNo} 題${f.inferred ? '，推定' : ''}）`,
          f.lines.length ? f.lines : ['（這一輪沒有單獨點名這一題）'])).join('');
        const v7 = q.versions.v7 ? ai(`AI 原文・第七版第 ${q.versions.v7.no} 題的修訂理由`, q.versions.v7.aiRationale) : '';
        return `<h4>初版第 ${q.originalQuestionId} 題</h4>${fb || '<p class="small muted">對話中沒有教師單獨點名這一題。</p>'}${v7}`;
      }).join('') +
      (c.aiNote ? ai('AI 原文・第二版的修訂說明', c.aiNote) : '') +
      (c.note ? derived('整理歸納', `<p>${esc(c.note)}</p>`) : '');
  } else {
    const cmp = compareBlock(s, qs);
    body = cmp.html +
      `<p class="small muted">修訂後題目由教師提出修改要求、AI 改寫，再經教師檢查與選用。</p>` +
      (cmp.q.revisionReason ? teacher('教師的判斷・題目分析表的修正原因', cmp.q.revisionReason) : '') +
      derived('整理歸納・審題原則', `<p class="principle">${esc(c.principle)}</p>`) +
      (s.done.has(c.id) ? '<p class="result ok">這個案例已完成。</p>' : btn('finish', c.id, '完成這個案例', 'primary'));
  }

  const canNext = s.stage < 3 && !(s.stage === 1 && s.guess == null);
  return `
    ${btn('case', '', '← 全部案例', 'ghost back')}
    <h3>案例 ${c.id}｜${esc(c.type)}</h3>
    <p class="meta">${esc(c.title)}</p>
    <ol class="stages">${stages}</ol>
    <section class="card">${body}</section>
    <div class="nav">
      ${btn('stage', s.stage - 1, '← 上一步', 'ghost', s.stage === 0 ? 'disabled' : '')}
      ${btn('stage', s.stage + 1, '下一步 →', 'primary', canNext ? '' : 'disabled')}
    </div>`;
}

/* ---------------- 04 器物展覽館 ---------------- */
function museumView(s) {
  const group = (g, title) => `<h4>${title}</h4><div class="exhibits">${data.artifacts.filter(a => a.group === g).map(a =>
    btn('artifact', a.id, esc(a.name), `exhibit ${g} ${a.id === s.artifact ? 'on' : ''}`, `aria-pressed="${a.id === s.artifact}"`)).join('')}</div>`;
  return `
    <p class="small muted">白色展台是傳統器物，灰色展台是現代器物。</p>
    ${group('traditional', '傳統器物')}${group('modern', '現代器物')}
    ${s.artifact ? artifactCard(artifact(s.artifact)) : '<p class="hint-box">點一件器物或一個展台。</p>'}`;
}

function artifactCard(a) {
  const VS = ['v1', 'v6', 'v7'].filter(vk => a.occurrences.some(o => o.version === vk));
  const cell = (vk, stem) => {
    const xs = a.occurrences.filter(o => o.version === vk && (stem ? o.inStem : !o.inStem));
    return xs.map(o => btn('question', o.originalQuestionId, `第${o.no}題${stem ? '' : `<small>（${o.inOptions.join('、')}）</small>`}`, 'chip')).join('') || '<span class="muted">—</span>';
  };
  const rows = VS.map(vk => `<tr><th>${VERSION_NAME[vk]}${vk === 'v7' ? '<small>（只有 4 題）</small>' : ''}</th><td>${cell(vk, true)}</td><td>${cell(vk, false)}</td></tr>`).join('');
  return `
    <section class="card">
      <h3>${esc(a.name)}</h3>
      ${derived('整理歸納・依題目內容摘寫', `<p>${esc(a.desc)}</p>`)}
      <table class="occ"><thead><tr><th></th><th>題幹考它</th><th>只出現在選項</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small muted">由關鍵字（${a.keywords.map(esc).join('、')}）搜尋每一版的題目自動算出。題號是當時那一版的題號；點題號到診斷塔看全文。</p>
    </section>`;
}

/* ---------------- 面板外框 ---------------- */
export function createPanel(root, set) {
  const nav = root.querySelector('.stations'), body = root.querySelector('.body'), head = root.querySelector('.head'),
    foot = root.querySelector('.foot');
  let lastKey = '';

  root.addEventListener('click', e => {
    const b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    const v = b.dataset.v, num = +v;
    const map = {
      station: () => set({ station: num }),
      close: () => set({ station: -1 }),
      round: () => set({ round: num }),
      indicator: () => set({ indicator: v }),
      question: () => set({ station: 1, question: num, version: 'v1' }),
      version: () => set({ version: v }),
      case: () => set({ kase: v || null, stage: 0, guess: null, compareQ: null, compareV: null }),
      stage: () => set({ stage: num }),
      guess: () => set({ guess: v }),
      compareQ: () => set({ compareQ: num, compareV: null }),
      compareV: () => set({ compareV: v }),
      finish: () => set({ finish: v }),
      artifact: () => set({ station: 3, artifact: v }),
    };
    map[b.dataset.act]?.();
  });

  function render(s) {
    root.classList.toggle('open', s.station >= 0);
    root.setAttribute('aria-hidden', s.station < 0);
    if (s.station < 0) return;
    const st = STATIONS[s.station], n = STATIONS.length;
    head.innerHTML = `<span class="pnum">${pad(st.n)}</span><div><h2>${esc(st.name)}</h2><p class="en">${esc(st.en)}</p></div>`;
    nav.innerHTML = STATIONS.map((x, i) => btn('station', i, `<b>${pad(x.n)}</b>${esc(x.name.slice(2))}`, i === s.station ? 'on' : '',
      `aria-pressed="${i === s.station}" title="${esc(x.name)}"`)).join('');
    const prev = STATIONS[(s.station + n - 1) % n], next = STATIONS[(s.station + 1) % n];
    foot.innerHTML = `${btn('station', (s.station + n - 1) % n, `← ${pad(prev.n)} ${esc(prev.name)}`, 'ghost')}
      ${btn('close', '', '返回全景', 'ghost')}
      ${btn('station', (s.station + 1) % n, `${pad(next.n)} ${esc(next.name)} →`, 'ghost')}`;
    const key = [s.station, s.round, s.question, s.kase, s.stage, s.artifact].join('|');
    const keep = key === lastKey ? body.scrollTop : 0;
    body.innerHTML = `<p class="lead intro">${esc(st.intro)}</p>` +
      [towerView, diagView, forgeView, museumView][s.station](s) +
      insight('策展觀點', st.insight);
    body.scrollTop = keep; lastKey = key;
  }
  return { render };
}
