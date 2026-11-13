# AI 協作命題知識島

以等角線稿風格的 3D 知識島，呈現國小四年級社會〈器物與生活〉25 道選擇題的 AI 協作命題歷程：從 AI 初稿、七輪教師回饋與修訂，到四項試題品質指標與六個代表修題案例。

## 四個展區

| 展區 | 內容 |
|---|---|
| 01 命題時光塔 | 七輪對話：教師檢視 → 發現問題 → AI 修訂 → 教師再檢視 |
| 02 試題診斷塔 | 初版 25 題的四項品質指標（題目語法、誘答性、答案正確、切合學習目標） |
| 03 修題鍛造坊 | 六個代表案例，分四階段比較修訂前後 |
| 04 器物展覽館 | 題目中出現的傳統與現代器物，以及它們在各版題目中的位置 |

另有策展導覽模式、滑過時的自然材質上色、角色互動等功能。

**線上瀏覽：** https://atultaistulunan.github.io/ai-item-writing-island/

推送到 `main` 後，GitHub Actions 會自動建置並更新網站（`.github/workflows/deploy.yml`）。

## 執行

需要 Node.js 18 以上。

```bash
cd island
npm install
npm run dev
```

開啟 http://localhost:5174 。

建置靜態網站：`npm run build`，產出在 `island/dist/`。

## 專案結構

```
data/island-data.json   網站讀取的資料（由 tools/build_data.py 產生）
tools/build_data.py     從原始對話紀錄與題目分析表整理出資料檔
tools/curated.json      人工整理的部分：各輪教師回饋原文、問題類型、案例、器物、策展文字
資料檢核報告.md          25 題題號對照、七輪歷程、器物出現位置與來源不一致之處
island/                 Vite + three.js 網站
  src/main.js           場景、相機、互動、導覽模式
  src/postprocess.js    法線＋深度描邊
  src/materials.js      配色
  src/paint.js          滑過時的線稿上色
  src/panel.js          右側內容面板
  src/labels.js         HTML 編號標籤
  src/models/           每種模型一個檔案
```

## 資料與證據等級

網站把內容分成四種證據等級並以不同框線標示：

- **教師原話**：對話紀錄中的教師回饋，或題目分析表中教師填寫的修正原因
- **AI 原文**：AI 產出的題目與修訂說明
- **整理歸納**：整理時歸納的問題類型、器物說明、審題原則
- **策展觀點**：策展規劃中的導言與結語

使用限制：四項指標只有初版的勾選資料；第七版只有四題，是對話紀錄中最新的修訂稿，沒有資料顯示已正式採用；沒有施測數據。

## 原始資料

`tools/build_data.py` 需要兩份原始檔（ChatGPT 對話紀錄 PDF、題目分析表 docx）才能重新產生資料。這兩份檔案沒有放進儲存庫；網站本身只需要 `data/island-data.json`，可以直接執行。
