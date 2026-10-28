// 웹(UNLOAD) / 데스크톱(DOWNLOAD) 분기.
// Tauri 2는 웹뷰에 window.__TAURI_INTERNALS__ 를 주입한다.
const isDesktop = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const platform = {
  isDesktop,
  edition: isDesktop ? 'DOWNLOAD' : 'UNLOAD',
};
