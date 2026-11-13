"""把兩份原始檔整合成知識島用的資料檔。

來源：
  設計選擇題.pdf   與 ChatGPT 的七輪對話紀錄（初版、第六版完整題目，第七版四題）
  題目分析表.docx  25 題的四項指標勾選、修正後題目、修正原因（教師填寫）
  tools/curated.json  人工整理：各輪教師回饋原文、問題類型、案例清單

輸出：
  data/island-data.json   統一題號（以初版題號為主鍵）的展示資料
  資料檢核報告.md          給人看的對照表與不一致清單

用法： python tools/build_data.py
兩份來源互相比對；curated.json 裡的原文逐段比對 PDF，對不上就中止。
"""
import difflib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / '設計選擇題.pdf'
DOCX = ROOT / '題目分析表.docx'
CURATED = ROOT / 'tools' / 'curated.json'
OUT_JSON = ROOT / 'data' / 'island-data.json'
OUT_MD = ROOT / '資料檢核報告.md'

LETTERS = 'ABCD'
INDICATORS = [('grammar', '題目語法'), ('distractor', '誘答性'), ('answerCorrect', '答案正確'), ('objective', '切合學習目標')]
# 淨灘統計表在 PDF 裡被拆成一行一格，而且初版那張還跨頁掉到別題中間，所以整行濾掉、另外補回
TABLE_LINES = {'海洋廢棄物', '數量', '寶特瓶', '67,076件', '塑膠瓶蓋', '50,295件', '吸管', '21,742件', '塑膠袋', '15,974件'}
BEACH_TABLE = [['寶特瓶', '67,076件'], ['塑膠瓶蓋', '50,295件'], ['吸管', '21,742件'], ['塑膠袋', '15,974件']]


def norm(s):
    """比對用：去掉所有空白、統一括號、去掉分析表用來分隔表格的斜線。"""
    s = re.sub(r'\s+', '', s).replace('(', '（').replace(')', '）').replace('／', '')
    return s


# ---------------------------------------------------------------- PDF
FURNITURE = re.compile(
    r'^(\d{4}/\d{1,2}/\d{1,2} .*\d:\d\d|設計選擇題|https://chatgpt\.com/.*|\d{1,2}/23|你說：|ChatGPT 說：|寫作|PDF|2-[23]\.pdf)$')


def read_pdf():
    """回傳 [(頁碼, 一行文字)]，已去掉頁首頁尾與介面文字。"""
    lines = []
    for i, page in enumerate(pymupdf.open(PDF)):
        for ln in page.get_text().splitlines():
            ln = ln.strip()
            if ln and not FURNITURE.match(ln):
                lines.append((i + 1, ln))
    return lines


def find(lines, pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i][1]):
            return i
    raise SystemExit(f'PDF 找不到預期的段落（start={start}）')


def split_question(text):
    """'題幹（A）…（B）…（C）…（D）…' → (題幹, [四個選項])"""
    parts = re.split(r'（([A-D])）', text)
    if [parts[i] for i in range(1, len(parts), 2)] != list(LETTERS):
        raise SystemExit('選項切不出 A～D：' + text[:40])
    clean = lambda s: s.strip(' \u3000')
    return clean(parts[0]), [clean(parts[i]) for i in range(2, len(parts), 2)]


def parse_questions(lines):
    """一段連續的 25 題。題號必須依序出現，避免把內文的「1.」誤認成題號。"""
    qs, cur = {}, None
    for pg, ln in lines:
        if ln in TABLE_LINES or re.match(r'^[一二三四]、.*（第\d+～\d+題）$', ln):
            continue
        m = re.match(r'^(\d{1,2})\.\s*(.*)$', ln)
        if m and int(m.group(1)) == (cur['no'] + 1 if cur else 1):
            cur = {'no': int(m.group(1)), 'page': pg, 'buf': [m.group(2)]}
            qs[cur['no']] = cur
        elif cur:
            cur['buf'].append(ln)
    out = {}
    for no, q in qs.items():
        stem, options = split_question(''.join(q['buf']))
        out[no] = {'no': no, 'stem': stem, 'options': options, 'page': q['page']}
    if sorted(out) != list(range(1, 26)):
        raise SystemExit(f'應該有 25 題，實際切出 {sorted(out)}')
    return out


def parse_pdf(lines):
    text = [ln for _, ln in lines]
    # 初版
    a = find(lines, lambda s: s.startswith('1. 早期居民常利用'))
    b = find(lines, lambda s: s == '教師用｜答案對照表', a)
    v1 = parse_questions(lines[a:b])
    c = find(lines, lambda s: s == '命題內容分布', b)
    for i in range(b, c - 1):
        m = re.match(r'^(\d{1,2})\.$', text[i])
        if m and text[i + 1] in LETTERS:
            v1[int(m.group(1))]['answer'] = text[i + 1]

    # 第六版
    a = find(lines, lambda s: '修訂第六版' in s)
    a = find(lines, lambda s: s == '一、選擇題', a) + 1
    b = find(lines, lambda s: s == '二、教師用答案表', a)
    v6 = parse_questions(lines[a:b])
    c = find(lines, lambda s: s == '四題修訂版本', b)
    for i in range(b, c - 1):          # 答案表被拆成「題號／答案」各一行，其中四組掉到下一頁的教師回饋中間
        if re.match(r'^\d{1,2}$', text[i]) and text[i + 1] in LETTERS:
            v6[int(text[i])]['answer'] = text[i + 1]

    # 第七版：四題
    d = find(lines, lambda s: s == '修訂後的答案分布', c)
    v7, cur = {}, None
    for pg, ln in lines[c + 1:d]:
        m = re.match(r'^第(\d+)題｜(.+)$', ln)
        if m:
            cur = {'no': int(m.group(1)), 'label': m.group(2), 'page': pg, 'buf': []}
            v7[cur['no']] = cur
        elif cur and (m := re.match(r'^正解 ([A-D])$', ln)):
            cur['answer'] = m.group(1)
        elif cur:
            cur['buf'].append(ln)
    for no, q in v7.items():
        body, _, why = ''.join(q.pop('buf')).partition('修訂理由：')
        q['stem'], q['options'] = split_question(body)
        q['aiRationale'] = why.strip()

    for name, ver in (('初版', v1), ('第六版', v6), ('第七版', v7)):
        missing = [n for n, q in ver.items() if 'answer' not in q]
        if missing:
            raise SystemExit(f'{name} 這些題號找不到答案：{missing}')
    return v1, v6, v7


# ---------------------------------------------------------------- DOCX
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


def para(p):
    """一個段落 → (文字, 是否有粗體)"""
    txt, bold = '', False
    for r in p.iter(W + 'r'):
        t = ''.join(x.text or '' for x in r.iter(W + 't'))
        b = r.find(f'{W}rPr/{W}b')
        if t.strip() and b is not None and b.get(W + 'val') not in ('0', 'false'):
            bold = True
        txt += t
    return txt.strip(), bold


def split_cell(paras):
    """儲存格段落 → 題幹行、四個選項、粗體選項的字母"""
    stem, options, bold = [], [], None
    for txt, b in paras:
        m = re.match(r'^[(（]([A-D])[)）]\s*(.*)$', txt)
        if m:
            options.append(m.group(2))
            if b:
                bold = m.group(1)
        elif txt:
            stem.append(txt)
    return stem, options, bold


def read_docx():
    root = ET.fromstring(zipfile.ZipFile(DOCX).read('word/document.xml'))
    rows = {}
    for tr in root.iter(W + 'tr'):
        cells = [[para(p) for p in tc.findall(W + 'p')] for tc in tr.findall(W + 'tc')]
        if len(cells) != 6 or not cells[0] or not cells[0][0][0].isdigit():
            continue                                   # 表頭與示範列（ex）
        no = int(cells[0][0][0])
        o_stem = [t for t, _ in cells[1] if t]
        _, o_opts, o_bold = split_cell(cells[2])
        r_stem, r_opts, r_bold = split_cell(cells[4])
        checks = {}
        for txt, _ in cells[3]:
            for key, label in INDICATORS:
                if label in txt:
                    checks[key] = not txt.startswith('□')
        if len(o_opts) != 4 or len(r_opts) != 4 or len(checks) != 4:
            raise SystemExit(f'分析表第 {no} 題格式不如預期')
        rows[no] = {
            'orig': {'stemLines': o_stem, 'options': o_opts, 'bold': o_bold},
            'rev': {'stemLines': r_stem, 'options': r_opts, 'bold': r_bold},
            'checks': checks,
            'reason': ' '.join(t for t, _ in cells[5] if t),
        }
    if sorted(rows) != list(range(1, 26)):
        raise SystemExit(f'分析表應該有 25 題，實際讀到 {sorted(rows)}')
    return rows


def stem_text(lines):
    """分析表的題幹（去掉淨灘表格那一行），回傳 (題幹, 是否含表格)"""
    keep = [l for l in lines if '／' not in l]
    return ''.join(keep), len(keep) != len(lines)


# ---------------------------------------------------------------- 整合
def compare(tag, sheet, pdf, diffs):
    """分析表 vs PDF。一致就用分析表的乾淨文字，不一致用 PDF（AI 實際產出）並記錄。"""
    stem, has_table = stem_text(sheet['stemLines'])
    ok = True
    if norm(stem) != norm(pdf['stem']):
        diffs.append({'where': tag, 'field': '題幹', 'sheet': stem, 'pdf': pdf['stem']}); ok = False
        stem = pdf['stem']
    options = []
    for i, (s, p) in enumerate(zip(sheet['options'], pdf['options'])):
        if norm(s) != norm(p):
            diffs.append({'where': tag, 'field': f'選項 {LETTERS[i]}', 'sheet': s, 'pdf': p}); ok = False
            s = p
        options.append(s)
    if sheet['bold'] and sheet['bold'] != pdf['answer']:
        diffs.append({'where': tag, 'field': '答案', 'sheet': sheet['bold'], 'pdf': pdf['answer']}); ok = False
    out = {'no': pdf['no'], 'stem': stem, 'options': options, 'answer': pdf['answer']}
    if has_table:
        # 題幹在 PDF 裡是「引言：〔表格〕提問」，補一個換行標出表格位置
        out['stem'] = re.sub(r'：(?=根據上表)', '：\n', stem)
        out['table'] = {'head': ['海洋廢棄物', '數量'], 'rows': BEACH_TABLE}
    return out, ok


def main():
    lines = read_pdf()
    v1, v6, v7 = parse_pdf(lines)
    sheet = read_docx()
    cur = json.loads(CURATED.read_text(encoding='utf8'))

    # --- curated 原文逐段比對 PDF
    hay = norm(''.join(ln for _, ln in lines if not re.match(r'^(\d{1,2}\.?|[A-D])$', ln)))
    bad = []
    for r in cur['rounds']:
        for key in ('teacherPrompt', 'teacherFeedback', 'aiQuote'):
            for seg in r.get(key, '').split('\n'):
                if seg and norm(seg) not in hay:
                    bad.append(f"第 {r['round']} 輪 {key}：{seg[:30]}…")
    for c in cur['cases']:
        if c.get('aiNote') and norm(c['aiNote']) not in hay:
            bad.append(f"案例 {c['id']} aiNote：{c['aiNote'][:30]}…")
    if bad:
        raise SystemExit('curated.json 這些原文在 PDF 裡找不到：\n  ' + '\n  '.join(bad))

    # --- 初版題號 → 第六版題號（用分析表「修正後題目」去對第六版題幹）
    v6_norm = {no: norm(q['stem']) for no, q in v6.items()}
    mapping = {}
    for no in range(1, 26):
        target = norm(stem_text(sheet[no]['rev']['stemLines'])[0])
        best = max(v6_norm, key=lambda k: difflib.SequenceMatcher(None, target, v6_norm[k]).ratio())
        ratio = difflib.SequenceMatcher(None, target, v6_norm[best]).ratio()
        if ratio < .9:
            raise SystemExit(f'初版第 {no} 題的修正後題目在第六版找不到對應（最高相似度 {ratio:.2f}）')
        mapping[no] = best
    if sorted(mapping.values()) != list(range(1, 26)):
        raise SystemExit('初版與第六版不是一對一對應')

    # --- 各輪回饋提到哪些題
    types = cur['issueTypes']
    mentions = {no: [] for no in range(1, 26)}
    rounds = []
    for r in cur['rounds']:
        issues = []
        for it in r['issues']:
            refs = []
            for stated, orig, *flag in it['refs']:
                ref = {'statedNo': stated, 'originalQuestionId': orig}
                if flag:
                    ref['inferred'] = True
                refs.append(ref)
                mentions[orig].append({'round': r['round'], 'statedNo': stated, 'issueType': it['type'],
                                       **({'inferred': True} if flag else {})})
            issues.append({'type': it['type'], 'label': types[it['type']], 'refs': refs})
        rounds.append({**{k: v for k, v in r.items() if k != 'issues'}, 'issues': issues,
                       'questionCount': len({x['originalQuestionId'] for i in issues for x in i['refs']})})

    # --- 25 題
    diffs, questions = [], []
    for no in range(1, 26):
        row, n6 = sheet[no], mapping[no]
        q1, ok1 = compare(f'初版第 {no} 題', row['orig'], v1[no], diffs)
        q6, ok6 = compare(f'第六版第 {n6} 題（初版第 {no} 題）', row['rev'], v6[n6], diffs)
        versions = {'v1': q1, 'v6': q6}
        source = {
            'v1': {'file': PDF.name, 'page': v1[no]['page']},
            'v6': {'file': PDF.name, 'page': v6[n6]['page']},
            'analysis': {'file': DOCX.name, 'row': no},
        }
        if n6 in v7:
            q7 = v7[n6]
            versions['v7'] = {k: q7[k] for k in ('no', 'label', 'stem', 'options', 'answer', 'aiRationale')}
            source['v7'] = {'file': PDF.name, 'page': q7['page']}
        same = norm(q1['stem'] + ''.join(q1['options'])) == norm(q6['stem'] + ''.join(q6['options']))
        questions.append({
            'originalQuestionId': no,
            'revisedQuestionId': n6,
            'topic': cur['topics'][str(no)],
            'latestVersion': 'v7' if n6 in v7 else 'v6',
            'changeType': 'unchanged' if same else 'revised',
            'versions': versions,
            'qualityIndicators': row['checks'],
            'revisionReason': row['reason'],
            'teacherFeedback': mentions[no],
            'source': source,
            'verificationStatus': {
                'v1': 'match' if ok1 else 'mismatch',
                'v6': 'match' if ok6 else 'mismatch',
                **({'v7': 'unconfirmed-adoption'} if n6 in v7 else {}),
            },
        })

    stats = {}
    for key, label in INDICATORS:
        fail = [q['originalQuestionId'] for q in questions if not q['qualityIndicators'][key]]
        stats[key] = {'label': label, 'pass': 25 - len(fail), 'fail': len(fail), 'failIds': fail}

    by_id = {q['originalQuestionId']: q for q in questions}
    cases = [{**c, 'revisedQuestionIds': [mapping[i] for i in c['originalQuestionIds']],
              'rounds': sorted({m['round'] for i in c['originalQuestionIds'] for m in by_id[i]['teacherFeedback']}),
              'hasV7': any('v7' in by_id[i]['versions'] for i in c['originalQuestionIds'])}
             for c in cur['cases']]

    # --- 器物：用關鍵字搜尋每一版題目的題幹（含表格）與選項
    artifacts = []
    for a in cur['artifacts']:
        occ = []
        for q in questions:
            for vk, v in q['versions'].items():
                stem = v['stem'] + ''.join(''.join(r) for r in v.get('table', {}).get('rows', []))
                in_stem = any(k in stem for k in a['keywords'])
                in_opts = [L for L, o in zip(LETTERS, v['options']) if any(k in o for k in a['keywords'])]
                if in_stem or in_opts:
                    occ.append({'originalQuestionId': q['originalQuestionId'], 'version': vk, 'no': v['no'],
                                'inStem': in_stem, 'inOptions': in_opts})
        if not occ:
            raise SystemExit(f"器物「{a['name']}」在題目裡找不到")
        artifacts.append({**a, 'occurrences': occ})
    for c in cases:
        c['props'] = cur['cases_props'][c['id']]

    data = {
        'meta': {
            'title': '〈器物與生活〉AI 協作命題歷程',
            'subject': '國小四年級上學期社會科 第2課〈器物與生活〉',
            'questionCount': 25,
            'roundCount': len(rounds),
            'sources': [
                {'id': 'chat', 'file': PDF.name, 'what': '與 ChatGPT 的對話紀錄，共 23 頁、七輪'},
                {'id': 'analysis', 'file': DOCX.name, 'what': '教師填寫的題目分析表（四項指標、修正後題目、修正原因）'},
            ],
            'notes': [
                '題號以初版題號（originalQuestionId）為主鍵；revisedQuestionId 是第六版題號，第七版沿用第六版題號。',
                'qualityIndicators 是教師對「初版」的勾選；第六、七版沒有對應的勾選資料。',
                '分析表的「人工修正後的題目」內容等於第六版：由教師提出修改要求、AI 改寫，再經教師檢查與選用。',
                '第七版只有四題，是對話紀錄中最新的修訂稿，沒有資料顯示已正式採用。',
                '第二至第五版的完整題文不在對話紀錄裡（介面只顯示修訂摘要）。',
                '沒有施測數據。',
            ],
        },
        'evidenceLevels': {
            'teacher': '教師原話：對話紀錄中的教師回饋，或分析表的修正原因',
            'ai': 'AI 原文：題目、修訂說明（aiQuote、aiRationale）',
            'derived': '整理時歸納：問題類型（issueType）、主題（topic）、題號對應的推定（inferred）',
        },
        'indicators': [{'key': k, 'label': l} for k, l in INDICATORS],
        'stats': stats,
        'issueTypes': types,
        'rounds': rounds,
        'questions': questions,
        'cases': cases,
        'artifacts': artifacts,
        'stations': cur['stations'],
        'curation': cur['curation'],
        'discrepancies': diffs,
    }
    OUT_JSON.parent.mkdir(exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    OUT_MD.write_text(report(data), encoding='utf8')

    print(f'OK  {OUT_JSON.relative_to(ROOT)}  {OUT_MD.name}')
    print('指標：' + '、'.join(f"{s['label']} {s['pass']}/25" for s in stats.values()))
    print(f"不一致 {len(diffs)} 處；未更動 {sum(q['changeType'] == 'unchanged' for q in questions)} 題；第七版 {len(v7)} 題")


# ---------------------------------------------------------------- 報告
def report(d):
    mark = lambda b: '✓' if b else '✗'
    L = ['# 資料檢核報告', '',
         '由 `tools/build_data.py` 產生，請勿手改；要更正請改來源或 `tools/curated.json` 後重跑。', '',
         '## 來源', '']
    L += [f"- `{s['file']}`：{s['what']}" for s in d['meta']['sources']]
    L += ['', '## 使用限制', ''] + [f'- {n}' for n in d['meta']['notes']]

    L += ['', '## 初版四項指標（教師勾選）', '', '| 指標 | 通過 | 未通過 | 未通過的初版題號 |', '|---|---|---|---|']
    for s in d['stats'].values():
        L.append(f"| {s['label']} | {s['pass']} | {s['fail']} | {'、'.join(map(str, s['failIds'])) or '—'} |")

    L += ['', '## 25 題題號對照', '',
          '「被點名輪次」是教師在哪幾輪回饋裡提到這一題；帶 * 的是從回饋內容推定的對應。', '',
          '| 初版 | 第六版 | 第七版 | 初版考點 | 語法 | 誘答 | 答案 | 目標 | 題文 | 被點名輪次 | 教師填寫的修正原因 |',
          '|---|---|---|---|---|---|---|---|---|---|---|']
    for q in d['questions']:
        c = q['qualityIndicators']
        seen = {}
        for m in q['teacherFeedback']:
            seen[m['round']] = seen.get(m['round'], False) or m.get('inferred', False)
        hit = '、'.join(f"{r}{'*' if inf else ''}" for r, inf in sorted(seen.items())) or '—'
        L.append(f"| {q['originalQuestionId']} | {q['revisedQuestionId']} | {'再修訂' if 'v7' in q['versions'] else '沿用'} | {q['topic']} | "
                 f"{mark(c['grammar'])} | {mark(c['distractor'])} | {mark(c['answerCorrect'])} | {mark(c['objective'])} | "
                 f"{'未更動' if q['changeType'] == 'unchanged' else '已修訂'} | {hit} | {q['revisionReason'] or '—'} |")

    L += ['', '## 七輪歷程', '', '| 輪 | 版本 | PDF 頁 | 題文完整度 | 教師點名題數 | 問題類型（整理時歸納） |', '|---|---|---|---|---|---|']
    full = {'complete': '完整 25 題', 'summary': '只有修訂摘要', 'partial': '只有修訂的 4 題'}
    for r in d['rounds']:
        kinds = '、'.join(dict.fromkeys(i['label'] for i in r['issues'])) or '—'
        L.append(f"| {r['round']} | {r['version']} | {r['pages'][0]}–{r['pages'][1]} | {full[r['fullText']]} | {r['questionCount'] or '—'} | {kinds} |")

    L += ['', '## 六個案例', '', '| 案例 | 類型 | 初版題號 | 第六版題號 | 被點名輪次 | 有第七版 |', '|---|---|---|---|---|---|']
    for c in d['cases']:
        L.append(f"| {c['id']} | {c['type']} | {'、'.join(map(str, c['originalQuestionIds']))} | {'、'.join(map(str, c['revisedQuestionIds']))} | "
                 f"{'、'.join(map(str, c['rounds'])) or '—'} | {'是' if c['hasV7'] else '否'} |")

    L += ['', '## 器物在題目中的出現位置', '',
          '依關鍵字自動搜尋。「題幹」表示題目在考它；「選項」表示只出現在選項（通常是誘答）。', '',
          '| 器物 | 初版：題幹 | 初版：選項 | 第六版：題幹 | 第六版：選項 | 第七版：題幹 |', '|---|---|---|---|---|---|']
    for a in d['artifacts']:
        def ids(vk, stem):
            xs = [o for o in a['occurrences'] if o['version'] == vk and (o['inStem'] if stem else (o['inOptions'] and not o['inStem']))]
            return '、'.join(str(o['no']) for o in xs) or '—'
        L.append(f"| {a['name']} | {ids('v1', 1)} | {ids('v1', 0)} | {ids('v6', 1)} | {ids('v6', 0)} | {ids('v7', 1)} |")

    L += ['', '## 兩份來源不一致之處', '']
    if d['discrepancies']:
        L += ['資料檔一律採用 PDF（AI 實際產出）的文字。', '', '| 位置 | 欄位 | 分析表 | PDF |', '|---|---|---|---|']
        L += [f"| {x['where']} | {x['field']} | {x['sheet']} | {x['pdf']} |" for x in d['discrepancies']]
    else:
        L.append('沒有。分析表的原題、修正後題目與 PDF 的初版、第六版逐字相符（忽略空白與括號全半形）。')
    return '\n'.join(L) + '\n'


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf8')
    main()
