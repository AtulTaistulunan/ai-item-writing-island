// 資料檔由 04/tools/build_data.py 從 PDF 與分析表產生，不要手改
import data from '../../data/island-data.json';

export default data;

export const question = id => data.questions.find(q => q.originalQuestionId === id);
export const round = n => data.rounds.find(r => r.round === n);
export const kase = id => data.cases.find(c => c.id === id);
export const latest = q => q.versions[q.latestVersion];
export const VERSION_NAME = { v1: '初版', v6: '第六版', v7: '第七版' };

/** 回饋文字裡「第2、6、7題」這類寫法提到的題號 */
function numbersIn(line) {
  const out = new Set();
  for (const m of line.matchAll(/第([\d、]+)題/g)) m[1].split('、').forEach(n => out.add(+n));
  return out;
}

/**
 * 這一題在各輪被教師點名的原話（只取提到該題的那幾行）。
 * 回傳 [{ round, statedNo, inferred, labels: [問題類型], lines: [原話] }]
 */
export function feedbackFor(q) {
  const byRound = new Map();
  for (const m of q.teacherFeedback) {
    const r = round(m.round);
    if (!byRound.has(m.round)) {
      const lines = (r.teacherFeedback || '').split('\n').filter(l => numbersIn(l).has(m.statedNo));
      byRound.set(m.round, { round: m.round, statedNo: m.statedNo, inferred: !!m.inferred, labels: [], lines });
    }
    const e = byRound.get(m.round), label = data.issueTypes[m.issueType];
    if (!e.labels.includes(label)) e.labels.push(label);
  }
  return [...byRound.values()];
}

export const artifact = id => data.artifacts.find(a => a.id === id);

/** 某一題（初版題號）任一版本的題幹考到的器物 */
export const artifactsIn = origId =>
  data.artifacts.filter(a => a.occurrences.some(o => o.originalQuestionId === origId && o.inStem));
