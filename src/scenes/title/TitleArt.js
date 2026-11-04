// 타이틀 일러스트: 계절마다 한 장의 그림(public/assets/title, 출처는 CREDITS.md — 임시 그림) 위에 지금을 덧칠한다.
//   실제 시각   → 빛 (새벽/낮/노을/밤). 평화로운 동안의 밤은 어둡게 가라앉지 않고 따뜻하다
//   지워진 사람 → 색이 빠진다
// 화면은 아주 느리게 다가간다(켄 번스). 흔들림·번쩍임은 없다.
import { timeOfDay, season } from '../../core/util/daily.js';

const LIGHT = {
  dawn: { filter: 'brightness(0.92)', tint: 0xffd6c4 },
  day: { filter: 'none', tint: 0xffffff },
  dusk: { filter: 'brightness(0.88)', tint: 0xffc098 },
  night: { filter: 'brightness(0.78) saturate(0.95)', tint: 0xd8c8e8 },
};

export function drawTitleArt(scene, { erased = [], date = new Date() } = {}) {
  const key = season(date) === 'winter' && scene.textures.exists('titleart.winter') ? 'titleart.winter' : 'titleart.base';
  if (!scene.textures.exists(key)) return null;
  const { width, height } = scene.scale;
  const light = LIGHT[timeOfDay(date)];
  const fade = Math.min(erased.length * 0.1, 0.65);
  const src = scene.textures.get(key).getSourceImage();
  if (scene.textures.exists('title.bg')) scene.textures.remove('title.bg');
  const tex = scene.textures.createCanvas('title.bg', src.width, src.height);
  const ctx = tex.getContext();
  ctx.filter = `${light.filter === 'none' ? '' : light.filter} saturate(${1 - fade})`.trim() || 'none';
  ctx.drawImage(src, 0, 0);
  tex.refresh();
  const img = scene.add.image(width / 2, height / 2, 'title.bg').setTint(light.tint);
  const cover = Math.max(width / src.width, height / src.height);
  img.setScale(cover * 1.04);
  scene.tweens.add({ targets: img, scale: cover * 1.1, duration: 40000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return img;
}
