import { defineConfig } from 'vite';

export default defineConfig({
  // 相對路徑：網站放在 GitHub Pages 的子路徑（/ai-item-writing-island/）也能正確載入
  base: './',
  // 資料檔在上一層的 data/，要允許 dev server 讀取
  server: { port: 5174, open: false, fs: { allow: ['..'] } },
  // three.js 本身就超過 500 kB，提高警告門檻，避免每次建置都出現無關的警告
  build: { chunkSizeWarningLimit: 900 },
});
