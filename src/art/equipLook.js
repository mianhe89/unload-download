// 장비 → 주인공 도트 외형. 옷 두 톤(밝은·어두운)을 갑옷 색으로 바꾼 시트를 실행 중에 만든다.
// 체형 도트(me@thin 등)와 겹쳐도 된다: 체형 시트를 바탕으로 색만 바꾼다.
import { EQUIPMENT } from '../../content/action/action.js';
import { characters } from '../../content/characters/index.js';
import { CHAR } from '../../content/art/pack.js';

// 주인공 옷 색 (content/characters/me.js의 재채색 결과: 밝은 셔츠, 어두운 셔츠)
const ME = characters.me.sprite.recolor;
export const SHIRT = [ME.e3f1f5, ME['548789']];

// 순수: 장비 → { 원래색: 바꿀색 } (없으면 null)
export function equipPalette(equip = {}) {
  const armor = equip.armor && EQUIPMENT[equip.armor]?.look?.body;
  if (!armor) return null;
  return { [SHIRT[0]]: armor[0], [SHIRT[1]]: armor[1] };
}

export const bladeColor = (equip = {}) => EQUIPMENT[equip.weapon]?.look?.blade ?? 'b08a5a'; // 목검은 나무색

// 실행 중: base 스킨에 장비 색을 입힌 텍스처·걷기 애니메이션을 만들고 그 키(char.<id>의 id)를 돌려준다
export function equipSkin(scene, baseSkin, equip) {
  const pal = equipPalette(equip);
  if (!pal) return baseSkin;
  const id = `${baseSkin}+${equip.armor}`;
  const key = `char.${id}`;
  if (!scene.textures.exists(key)) {
    const src = scene.textures.get(`char.${baseSkin}`).getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = src.width; canvas.height = src.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const map = Object.fromEntries(Object.entries(pal).map(([a, b]) => [Number.parseInt(a, 16), Number.parseInt(b, 16)]));
    for (let i = 0; i < img.data.length; i += 4) {
      if (!img.data[i + 3]) continue;
      const c = (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
      const to = map[c];
      if (to !== undefined) { img.data[i] = to >> 16; img.data[i + 1] = (to >> 8) & 255; img.data[i + 2] = to & 255; }
    }
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
