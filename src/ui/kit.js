// UI 공용 부품: 색, 글자, 금 테두리 창. 대화창·가운데 창·메뉴바·지도가 모두 여기서 생김새를 가져간다.
// 생김새를 바꿀 땐 이 파일만 고친다. 크기는 960 기준 값에 화면 배율(s)을 곱해 쓴다.
import { FONT, FONT_BOLD } from '../config/game.js';

export const COLORS = {
  // 창 바탕과 테두리 (축제의 노점 간판 같은 따뜻한 밤색 + 금)
  body: 0x3d2b22, bodyAlpha: 0.95, sheen: 0xffe6b8, sheenAlpha: 0.07,
  gold: 0xe8b860, goldLight: 0xf8dc90, inner: 0x8a6038, shadow: 0x000000,
  plate: 0xf8ecd2,           // 이름 명패
  listener: 0x8c8090,        // 대화창에서 듣는 쪽 일러스트에 곱하는 색
  // 글자
  text: '#fff4e2', narration: '#ecd8b4', sub: '#ecd8b4', dim: '#a89078', accent: '#f8d070',
  plateText: '#3a2418', more: '#f8d070',
};

// 화면 배율: 960 기준 값 → 실제 픽셀
export const scaleOf = (scene) => scene.scale.width / 960;

// 글자 하나. size는 960 기준 크기
export function text(scene, x, y, str, { size = 12, color = COLORS.text, bold = false, ...style } = {}) {
  const s = scaleOf(scene);
  return scene.add.text(x, y, str, { fontFamily: bold ? FONT_BOLD : FONT, fontSize: `${size * s}px`, color, ...style });
}

// 금 테두리 창 (g: Graphics, 왼쪽 위 기준)
//   corners: 'dot'(동그란 장식) | 'diamond'(마름모) | null
export function frame(g, x, y, w, h, s, { alpha = COLORS.bodyAlpha, shadow = true, sheen = true, corners = 'dot', radius = 10 } = {}) {
  const r = radius * s;
  if (shadow) g.fillStyle(COLORS.shadow, 0.35).fillRoundedRect(x + 4 * s, y + 6 * s, w, h, r);
  g.fillStyle(COLORS.body, alpha).fillRoundedRect(x, y, w, h, r);
  if (sheen) g.fillStyle(COLORS.sheen, COLORS.sheenAlpha).fillRoundedRect(x + 3 * s, y + 3 * s, w - 6 * s, h * 0.4, r * 0.8);
  g.lineStyle(3 * s, COLORS.gold, 1).strokeRoundedRect(x, y, w, h, r);
  g.lineStyle(1 * s, COLORS.inner, 1).strokeRoundedRect(x + 5 * s, y + 5 * s, w - 10 * s, h - 10 * s, r * 0.6);
  if (!corners) return;
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    if (corners === 'diamond') {
      const d = 4.5 * s;
      g.fillStyle(COLORS.goldLight, 1).fillTriangle(cx, cy - d, cx + d, cy, cx, cy + d).fillTriangle(cx, cy - d, cx - d, cy, cx, cy + d);
      g.fillStyle(COLORS.inner, 1).fillCircle(cx, cy, 1.3 * s);
    } else {
      g.fillStyle(COLORS.goldLight, 1).fillCircle(cx, cy, 3.2 * s);
      g.fillStyle(COLORS.inner, 1).fillCircle(cx, cy, 1.4 * s);
    }
  }
}

// 창 위에 걸리는 금색 제목 띠 (가운데 기준)
export function titleBand(scene, g, cx, y, label, s) {
  const tw = (label.length * 13 + 40) * s;
  g.fillStyle(COLORS.gold, 1).fillRoundedRect(cx - tw / 2, y - 12 * s, tw, 26 * s, 6 * s);
  g.fillStyle(0xfff0c8, 0.5).fillRect(cx - tw / 2 + 6 * s, y - 9 * s, tw - 12 * s, 2 * s);
  return text(scene, cx, y + 1 * s, label, { size: 13, bold: true, color: COLORS.plateText }).setOrigin(0.5);
}
