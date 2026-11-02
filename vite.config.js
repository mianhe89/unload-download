import { defineConfig } from 'vite';

// Tauri 개발 서버 설정과 맞춤
export default defineConfig({
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    outDir: 'dist',
    target: 'es2022',
    // Phaser(1MB 넘음)는 따로 묶는다: 게임 코드만 바뀐 업데이트는 작은 파일만 다시 받는다
    chunkSizeWarningLimit: 1600,
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'phaser', test: /node_modules[\\/]phaser[\\/]/ }, { name: 'vendor', test: /node_modules/ }] },
      },
    },
  },
  // 단위 테스트(Vitest). 브라우저 없이 Node에서 돈다. E2E는 playwright.config.js
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
});
