import { defineConfig } from 'vite';

// Tauri 개발 서버 설정과 맞춤
export default defineConfig({
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { outDir: 'dist', target: 'es2022' },
  // 단위 테스트(Vitest). 브라우저 없이 Node에서 돈다. E2E는 playwright.config.js
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
});
