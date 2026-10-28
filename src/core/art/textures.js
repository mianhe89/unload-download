// content/art의 RGBA 데이터를 Phaser 텍스처로 올린다. 게임 시작 시 한 번.
import { characters } from '../../../content/characters/index.js';
import { composeSheet, FRAME } from '../../../content/art/compose.js';
import { tilePixels, propPixels, bonfirePixels, TILE_NAMES, PROP_NAMES, TILE } from '../../../content/art/tiles.js';

function canvasFrom(scene, key, w, h, rgba) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const img = ctx.createImageData(w, h);
  img.data.set(rgba);
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return tex;
}

export function buildTextures(scene) {
  if (scene.textures.exists('char.me')) return;

  // 캐릭터: 가로 9프레임 시트 → 프레임 등록
  for (const [id, def] of Object.entries(characters)) {
    const sheet = composeSheet(def.art);
    const tex = canvasFrom(scene, `char.${id}`, sheet.width, sheet.height, sheet.data);
    for (let i = 0; i < 9; i += 1) tex.add(i, 0, i * FRAME, 0, FRAME, FRAME);
  }

  // 타일: 종류마다 변형 4개 (반복 무늬 티 안 나게)
  for (const kind of TILE_NAMES) {
    for (let v = 0; v < 4; v += 1) canvasFrom(scene, `tile.${kind}.${v}`, TILE, TILE, tilePixels(kind, 11 + v * 97));
  }
  for (const kind of PROP_NAMES) canvasFrom(scene, `prop.${kind}`, TILE, TILE, propPixels(kind));

  // 큰 모닥불: 3프레임 시트
  {
    const sheet = new Uint8ClampedArray(96 * 32 * 4);
    for (let f = 0; f < 3; f += 1) {
      const fp = bonfirePixels(f);
      for (let y = 0; y < 32; y += 1) sheet.set(fp.subarray(y * 128, y * 128 + 128), (y * 96 + f * 32) * 4);
    }
    const tex = canvasFrom(scene, 'fx.bonfire', 96, 32, sheet);
    for (let f = 0; f < 3; f += 1) tex.add(f, 0, f * 32, 0, 32, 32);
  }

  // 빛: 부드러운 원형 그라데이션
  const glow = scene.textures.createCanvas('fx.glow', 128, 128);
  const g = glow.getContext();
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  glow.refresh();
}

export function buildAnimations(scene) {
  if (!scene.anims.exists('fx.bonfire')) {
    scene.anims.create({ key: 'fx.bonfire', frames: [0, 1, 2, 1].map((f) => ({ key: 'fx.bonfire', frame: f })), frameRate: 8, repeat: -1 });
  }
  for (const id of Object.keys(characters)) {
    const key = `char.${id}`;
    if (scene.anims.exists(`${key}.down`)) continue;
    [['down', 0], ['up', 3], ['side', 6]].forEach(([dir, start]) => {
      scene.anims.create({
        key: `${key}.${dir}`,
        frames: [1, 0, 2, 0].map((f) => ({ key, frame: start + f })),
        frameRate: 7,
        repeat: -1,
      });
    });
  }
}
