// 장비 → 주인공 도트 외형. 옷 두 톤(밝은·어두운)을 갑옷 색으로, 머리 두 톤을 투구·모자 색으로 바꾸고 망토를 덧그린 시트를 실행 중에 만든다.
// 체형 도트(me@thin 등)와 겹쳐도 된다: 체형 시트를 바탕으로 색만 바꾼다.
import { EQUIPMENT } from '../../content/action/action.js';
import { characters } from '../../content/characters/index.js';
import { CHAR } from '../../content/art/pack.js';
import { WorldMemory } from '../core/world/WorldMemory.js';

// 지금 진행의 의장 (없으면 빈칸)
const WorldMemoryLook = () => WorldMemory.run?.look ?? {};

// 주인공 옷 색 (content/characters/me.js의 재채색 결과: 밝은 셔츠, 어두운 셔츠)
const ME = characters.me.sprite.recolor;
export const SHIRT = [ME.e3f1f5, ME['548789']];
// 머리 두 톤 (밝은·어두운). 같은 갈색이 허리띠·신발에도 있어서 칸의 위쪽(HEAD_ROWS줄)만 바꾼다
export const HAIR = [ME.d14b34, ME['965340']];
export const HEAD_ROWS = 12;
export const SKIN = 'ef914f';   // 얼굴 (팩 원본 그대로) — 바로 위의 머리 줄이 투구 테두리가 된다
const OUTLINE = '141b1b';

// 순수: 장비 → { 원래색: 바꿀색 } (없으면 null)
// 의장(look): 성능과 따로 겉모습만 정하는 칸. look.armor가 있으면 입은 갑옷 대신 그 옷 색으로 보인다
export const shownArmor = (equip = {}, look = {}) => look?.armor ?? equip?.armor ?? null;
export const shownHead = (equip = {}, look = {}) => look?.head ?? equip?.head ?? null;
export const shownCape = (equip = {}, look = {}) => look?.cape ?? equip?.cape ?? null;
export const capeColors = (equip = {}, look = {}) => EQUIPMENT[shownCape(equip, look)]?.look?.cape ?? null;

export function equipPalette(equip = {}, look = {}) {
  const shown = shownArmor(equip, look);
  const armor = shown && EQUIPMENT[shown]?.look?.body;
  if (!armor) return null;
  return { [SHIRT[0]]: armor[0], [SHIRT[1]]: armor[1] };
}

// 순수: 투구·모자 → 머리 색 { 원래색: 바꿀색 } (없으면 null). 칸의 위쪽 HEAD_ROWS줄에만 쓴다
export function headPalette(equip = {}, look = {}) {
  const shown = shownHead(equip, look);
  const head = shown && EQUIPMENT[shown]?.look?.head;
  if (!head) return null;
  return { [HAIR[0]]: head[0], [HAIR[1]]: head[1] };
}
export const headRim = (equip = {}, look = {}) => EQUIPMENT[shownHead(equip, look)]?.look?.head?.[2] ?? null;

// 순수: 겉모습 이름 (텍스처 키에 쓴다) — 바뀌는 것이 없으면 ''
export function lookId(equip = {}, look = {}) {
  const parts = [];
  if (equipPalette(equip, look)) parts.push(shownArmor(equip, look));
  if (headPalette(equip, look)) parts.push(shownHead(equip, look));
  if (capeColors(equip, look)) parts.push(shownCape(equip, look));
  return parts.join('+');
}

// 순수: RGBA 바이트 배열(가로 w)에 색을 바꾼다. head는 칸(frame)마다 위쪽 rows줄에만
//   rim: 얼굴 바로 위 머리 칸을 이 색으로 (투구 테두리·모자 띠). 머리 모양 그대로면 회색 머리처럼 보여서
//   투구는 맨 윗줄의 머리카락 틈도 메워 둥근 꼭대기로 만든다
export function recolorPixels(data, w, body, head, frame = CHAR.frame, rows = HEAD_ROWS, rim = null) {
  const num = (h) => Number.parseInt(h, 16);
  const toMap = (pal) => pal && Object.fromEntries(Object.entries(pal).map(([a, b]) => [num(a), num(b)]));
  const B = toMap(body), H = toMap(head);
  const px = (i) => (data[i + 3] ? (data[i] << 16) | (data[i + 1] << 8) | data[i + 2] : -1);
  const set = (i, to) => { data[i] = to >> 16; data[i + 1] = (to >> 8) & 255; data[i + 2] = to & 255; data[i + 3] = 255; };
  const src = Uint8ClampedArray.from(data);
  const at = (x, y) => { const i = (y * w + x) * 4; return src[i + 3] ? (src[i] << 16) | (src[i + 1] << 8) | src[i + 2] : -1; };
  const h = data.length / 4 / w;
  // 눈 흰자는 밝은 셔츠와 같은 색이라, 옷 색을 바꾸면 눈까지 물든다. 상하좌우에 같은 옷 색이 없는 외딴 칸은 눈으로 보고 남긴다
  const shirt = new Set(SHIRT.map(num));
  const isEye = (x, y, c) => shirt.has(c) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    return nx >= 0 && nx < w && ny >= 0 && ny < h && shirt.has(at(nx, ny));
  });
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % w, y = Math.floor(i / 4 / w);
    const c = px(i);
    const inHead = H && y % frame < rows;
    if (c < 0) {
      // 투구 꼭대기: 맨 윗줄(머리 첫 줄)에서 양옆이 외곽선인 빈칸을 외곽선으로
      if (inHead && rim && x > 0 && x < w - 1 && y + 1 < h && at(x - 1, y) === num(OUTLINE) && at(x + 1, y) === num(OUTLINE) && at(x, y + 1) === num(OUTLINE)) set(i, num(OUTLINE));
      continue;
    }
    let to;
    if (inHead && H[c] !== undefined) to = (rim && y + 1 < h && (y + 1) % frame < rows && at(x, y + 1) === num(SKIN)) ? num(rim) : H[c];
    else if (B?.[c] !== undefined && !isEye(x, y, c)) to = B[c];
    if (to !== undefined) set(i, to);
  }
  return data;
}

// 순수: 망토를 그린다. 팩의 주인공엔 망토가 없어서, 방향마다 몸통에 덧칠한다(CHAR.dirs: 열 = 아래·위·왼·오)
//   뒷모습: 어깨 아래의 옷(셔츠·바지)을 망토 두 톤으로 덮는다(위는 밝게, 아래는 어둡게)
//   앞모습: 어깨 양 끝 한 칸씩 — 어깨에 걸친 자락
//   옆모습: 등 쪽 외곽선 자리부터 바깥으로 자락(어깨 한 칸, 아래 두 칸) + 새 외곽선
export const CAPE_TOP = 11; // 칸 안에서 망토가 시작하는 줄 (어깨)
export function drawCape(data, w, cape, frame = CHAR.frame, dirs = CHAR.dirs) {
  if (!cape) return data;
  const num = (h) => Number.parseInt(h, 16);
  const [L, D] = [num(cape[0]), num(cape[1])];
  const O = num(OUTLINE), cloth = new Set([...SHIRT, HAIR[0], HAIR[1]].map(num));
  const h = data.length / 4 / w;
  const src = Uint8ClampedArray.from(data);
  const at = (x, y) => { const i = (y * w + x) * 4; return src[i + 3] ? (src[i] << 16) | (src[i + 1] << 8) | src[i + 2] : -1; };
  const set = (x, y, c) => { const i = (y * w + x) * 4; data[i] = c >> 16; data[i + 1] = (c >> 8) & 255; data[i + 2] = c & 255; data[i + 3] = 255; };
  const dirOf = Object.fromEntries(Object.entries(dirs).map(([k, v]) => [v, k]));
  for (let fy = 0; fy + frame <= h; fy += frame) {
    for (let fx = 0; fx + frame <= w; fx += frame) {
      const dir = dirOf[Math.floor(fx / frame) % Object.keys(dirs).length];
      for (let r = CAPE_TOP; r < frame; r += 1) {
        const y = fy + r;
        const row = [];
        for (let x = fx; x < fx + frame; x += 1) if (at(x, y) >= 0) row.push(x);
        if (!row.length) continue;
        const tone = r < CAPE_TOP + 2 ? L : D;
        if (dir === 'up') {
          for (const x of row) if (cloth.has(at(x, y))) set(x, y, tone);
        } else if (dir === 'down') {
          if (r > CAPE_TOP + 2) continue;
          // 왼·오 외곽선 바로 안쪽 한 칸
          const inner = row.filter((x) => at(x, y) !== O);
          if (inner.length > 2) { set(inner[0], y, tone); set(inner.at(-1), y, tone); }
        } else {
          // 왼쪽을 보면 등은 오른쪽, 오른쪽을 보면 등은 왼쪽
          const back = dir === 'left' ? row.at(-1) : row[0];
          const step = dir === 'left' ? 1 : -1;
          const inFrame = (x) => x >= fx && x < fx + frame;
          // 어깨 줄은 한 칸, 그 아래는 두 칸 자락 (등 뒤로 늘어진다)
          const width = r === CAPE_TOP ? 1 : 2;
          let x = back;
          set(x, y, tone);
          for (let k = 1; k < width && inFrame(x + step) && at(x + step, y) < 0; k += 1) { x += step; set(x, y, tone); }
          if (inFrame(x + step) && at(x + step, y) < 0) set(x + step, y, O);
        }
      }
    }
  }
  return data;
}

export const bladeColor = (equip = {}) => EQUIPMENT[equip.weapon]?.look?.blade ?? 'b08a5a'; // 목검은 나무색

// 실행 중: base 스킨에 장비 색을 입힌 텍스처·걷기 애니메이션을 만들고 그 키(char.<id>의 id)를 돌려준다
export function equipSkin(scene, baseSkin, equip, look = WorldMemoryLook()) {
  const name = lookId(equip, look);
  if (!name) return baseSkin;
  const id = `${baseSkin}+${name}`;
  const key = `char.${id}`;
  if (!scene.textures.exists(key)) {
    const src = scene.textures.get(`char.${baseSkin}`).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = src.width; canvas.height = src.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    recolorPixels(img.data, canvas.width, equipPalette(equip, look), headPalette(equip, look), CHAR.frame, HEAD_ROWS, headRim(equip, look));
    drawCape(img.data, canvas.width, capeColors(equip, look));
    ctx.putImageData(img, 0, 0);
    const tex = scene.textures.addCanvas(key, canvas);
    const F = CHAR.frame, cols = Math.floor(canvas.width / F);
    for (let i = 0; i < cols * Math.floor(canvas.height / F); i += 1) tex.add(i, 0, (i % cols) * F, Math.floor(i / cols) * F, F, F);
  }
  const A = scene.anims;
  const base = `char.${baseSkin}`;
  for (const dir of Object.keys(CHAR.dirs)) {
    const k = `${key}.${dir}`;
    if (A.exists(k) || !A.exists(`${base}.${dir}`)) continue;
    const ref = A.get(`${base}.${dir}`);
    A.create({ key: k, frames: ref.frames.map((f) => ({ key, frame: f.frame.name })), frameRate: ref.frameRate, repeat: -1 });
  }
  return id;
}
