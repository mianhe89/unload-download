// 공용 몸 템플릿 (16×16 치비, 코어키퍼 계열)
// 팔레트 키는 docs/아트디렉션.md 참고

export const O = '#2a1f2e';
export const SKIN = { s: '#f4cba8', S: '#d99a7a' };

// ── 몸 템플릿: 방향별, 걷기 3프레임(서기/왼발/오른발) ─────────────
const HEAD_DOWN = [
  '................',
  '....oooooooo....',
  '...ossssssssO...',
  '..ossssssssssO..',
  '..ossssssssssO..',
  '..ossessssesso..',
  '..oSssssssssSo..',
  '...oSSssssSSo...',
  '....oooooooo....',
];
const HEAD_UP = [
  '................',
  '....oooooooo....',
  '...ossssssssO...',
  '..ossssssssssO..',
  '..ossssssssssO..',
  '..ossssssssssO..',
  '..oSssssssssSo..',
  '...oSSssssSSo...',
  '....oooooooo....',
];
const HEAD_SIDE = [
  '................',
  '.....oooooo.....',
  '....ossssssO....',
  '...ossssssssO...',
  '...ossssssssO...',
  '...ossssssesso..',
  '...osssssssssO..',
  '....oSsssssSo...',
  '.....oooooo.....',
];
const BODY_FRONT = [
  '...oCccccccCo...',
  '..osCccccccCso..',
  '...oCccaaccCo...',
  '...oppppppppo...',
];
const BODY_SIDE = [
  '.....oCcccCo....',
  '.....oCccsCo....',
  '.....oCcaaCo....',
  '.....oppppo.....',
];
const LEGS_FRONT = [
  ['....oppo.oppo...', '....obbo.obbo...', '....oooo.oooo...'],
  ['....oppo.obbo...', '....obbo.oooo...', '....oooo........'],
  ['....obbo.oppo...', '....oooo.obbo...', '.........oooo...'],
];
const LEGS_SIDE = [
  ['.....oppppo.....', '.....obbbbo.....', '.....oooooo.....'],
  ['....oppo.ppo....', '....obbo.obbo...', '....oooo.oooo...'],
  ['.....opppo......', '....obboobo.....', '....oooo.oo.....'],
];

export const BASE = {
  down: (f) => [...HEAD_DOWN, ...BODY_FRONT, ...LEGS_FRONT[f]],
  up:   (f) => [...HEAD_UP, ...BODY_FRONT, ...LEGS_FRONT[f]],
  side: (f) => [...HEAD_SIDE, ...BODY_SIDE, ...LEGS_SIDE[f]],
};
