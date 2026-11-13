import { defineConfig } from 'vite';

export default defineConfig({
  // 資料檔在上一層的 data/，要允許 dev server 讀取
  server: { port: 5174, open: false, fs: { allow: ['..'] } },
});
