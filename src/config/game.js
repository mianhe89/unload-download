import { platform } from '../platform/index.js';

// 웹판(UNLOAD)은 저해상도, 데스크톱판(DOWNLOAD)은 고해상도.
// 웹판의 해상도 한계는 '좁은 세계의 증상'이라는 설정으로 연출에 쓴다.
export const VIEW = platform.isDesktop ? { width: 1920, height: 1080 } : { width: 960, height: 540 };

// 화면 배율: 16px 타일이 몇 배로 보이는가
export const ZOOM = platform.isDesktop ? 4 : 2;

export const PLAYER_SPEED = 72;      // px/s (월드 좌표)
export const TALK_RANGE = 22;        // 말 걸 수 있는 거리 (px)
export const BUBBLE_RANGE = 48;      // 혼잣말이 보이는 거리 (px)

export const FONT = 'Galmuri11';
export const FONT_BOLD = 'Galmuri11Bold';

export const KEYS = {
  up: ['W', 'UP'],
  down: ['S', 'DOWN'],
  left: ['A', 'LEFT'],
  right: ['D', 'RIGHT'],
  act: ['E', 'SPACE', 'ENTER'],
};
