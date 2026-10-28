import { defineConfig } from 'vite';

// Tauri 개발 서버 설정과 맞춤
export default defineConfig({
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', target: 'es2022' },
});
