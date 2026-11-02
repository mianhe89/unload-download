// 체형 변형: 주인공 스프라이트시트의 몸통 줄을 넓히거나 좁혀 체형별 도트를 만든다 (원본 팩 형식 16×16 프레임).
// 팩 캐릭터는 머리가 크다(1~10줄), 몸통은 11~14줄. 가장 바깥 픽셀(외곽선)을 한 칸씩 밖/안으로 옮긴다.
// 앞·뒤 보는 프레임(열 0·1)은 크게, 옆 보는 프레임(열 2·3)은 몸통만 조금 (코가 늘어나지 않게)
//   chubby  앞뒤: 볼(8~10줄)과 몸통(11~14줄) 넓힘 / 옆: 몸통 12~14줄 넓힘
//   muscle  앞뒤: 어깨(11~12줄) 넓힘 / 옆: 그대로
//   thin    앞뒤: 몸통(11~14줄) 좁힘 / 옆: 그대로
import { blank } from './pixels.mjs';

const F = 16;
const px = (img, x, y) => { const i = (y * img.width + x) * 4; return img.data.slice(i, i + 4); };
const put = (img, x, y, c) => { const i = (y * img.width + x) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = c[3]; };
const CLEAR = [0, 0, 0, 0];

function rowSpan(img, fx, fy, r) {
  let L = -1, R = -1;
  for (let x = 0; x < F; x += 1) if (px(img, fx + x, fy + r)[3]) { if (L < 0) L = x; R = x; }
  return L < 0 ? null : [L, R];
}

export function bodyVariant(src, kind) {
  const img = blank(src.width, src.height);
  src.data.copy(img.data);
  const ROWS = {
    chubby: { front: [8, 9, 10, 11, 12, 13, 14], side: [12, 13, 14] },
    muscle: { front: [11, 12], side: [] },
    thin: { front: [11, 12, 13, 14], side: [] },
  }[kind];
  for (let fy = 0; fy < src.height; fy += F) for (let fx = 0; fx < src.width; fx += F) {
    const rows = (fx / F) % 4 < 2 ? ROWS.front : ROWS.side;
    for (const r of rows) {
      const span = rowSpan(src, fx, fy, r);
      if (!span) continue;
      const [L, R] = span;
      if (kind === 'thin') {
        if (R - L < 5) continue;
        put(img, fx + L + 1, fy + r, px(src, fx + L, fy + r)); put(img, fx + L, fy + r, CLEAR);
        put(img, fx + R - 1, fy + r, px(src, fx + R, fy + r)); put(img, fx + R, fy + r, CLEAR);
      } else {
        if (L > 0) { put(img, fx + L - 1, fy + r, px(src, fx + L, fy + r)); put(img, fx + L, fy + r, px(src, fx + L + 1, fy + r)); }
        if (R < F - 1) { put(img, fx + R + 1, fy + r, px(src, fx + R, fy + r)); put(img, fx + R, fy + r, px(src, fx + R - 1, fy + r)); }
      }
    }
  }
  return img;
}

export const BODY_SKINS = ['thin', 'muscle', 'chubby'];
