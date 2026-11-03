// 내부 해상도. 웹판도 1920×1080으로 그려 글자·그림이 선명하다(UI는 모두 width / 960 비율로 커진다).
// 웹판의 '좁은 세계'는 해상도가 아니라 안개·가장자리 연출로 보여 준다.
export const VIEW = { width: 1920, height: 1080 };

// 화면 배율: 16px 타일이 몇 배로 보이는가. 4배면 한 화면에 가로 30칸 × 세로 17칸이 보인다
export const ZOOM = 4;

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
