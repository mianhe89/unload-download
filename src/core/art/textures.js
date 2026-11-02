// 텍스처 준비.
// 1) loadPackAssets: 에셋 빌드 결과(public/assets/gen, manifest.json)를 Phaser 로더에 올린다 (Boot의 preload)
// 2) buildTextures: 시트에 물체 프레임을 등록하고, 코드로 그리는 작은 소품·빛을 만든다 (Boot의 create)
import { characters } from '../../../content/characters/index.js';
import { OBJECTS, ANIMATED, PARTICLES, CHAR, FACE } from '../../../content/art/pack.js';
import { propPixels, PROP_NAMES, TILE } from '../../../content/art/tiles.js';

const BASE = 'assets/gen/';

export function loadPackAssets(scene, manifest) {
  const L = scene.load;
  for (const [id, path] of Object.entries(manifest.chars)) L.spritesheet(`char.${id}`, BASE + path, { frameWidth: CHAR.frame, frameHeight: CHAR.frame });
  for (const [id, path] of Object.entries(manifest.faces)) L.image(`face.${id}`, BASE + path);
  for (const [key, path] of Object.entries(manifest.sheets)) L.image(`sheet.${key}`, BASE + path);
  for (const [key, path] of Object.entries(manifest.anim)) {
    const [fw, fh] = ANIMATED[key].frame;
    L.spritesheet(`anim.${key}`, BASE + path, { frameWidth: fw, frameHeight: fh });
  }
  for (const [key, path] of Object.entries(manifest.fx)) {
    const p = PARTICLES[key];
    if (p) L.spritesheet(`fx.${key}`, BASE + path, { frameWidth: p.frame[0], frameHeight: p.frame[1] });
    else L.image(`fx.${key}`, BASE + path);
  }
}

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
  // 물체 프레임: 원본 시트 안의 사각형에 이름을 붙인다 (sheet.house 의 'bakery' 등)
  for (const [name, def] of Object.entries(OBJECTS)) {
    const tex = scene.textures.get(`sheet.${def.sheet}`);
    if (!tex || tex.key === '__MISSING') throw new Error(`시트가 없음: ${def.sheet} (${name})`);
    if (!tex.has(name)) tex.add(name, 0, ...def.rect);
  }

  // 대본용 작은 소품 (빵, 화관, 반지 등). 아직 코드로 그린다
  for (const kind of PROP_NAMES) if (!scene.textures.exists(`prop.${kind}`)) canvasFrom(scene, `prop.${kind}`, TILE, TILE, propPixels(kind));

  // 빛: 부드러운 원형 그라데이션 (조명·어둠 지우개)
  if (!scene.textures.exists('fx.glow')) {
    const glow = scene.textures.createCanvas('fx.glow', 128, 128);
    const g = glow.getContext();
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    glow.refresh();
  }
  // 반딧불·먼지용 작은 점
  if (!scene.textures.exists('fx.dot')) {
    const d = scene.textures.createCanvas('fx.dot', 4, 4);
    const c = d.getContext();
    c.fillStyle = '#ffffff'; c.fillRect(1, 0, 2, 4); c.fillRect(0, 1, 4, 2);
    d.refresh();
  }
}

export function buildAnimations(scene) {
  const A = scene.anims;
  // 캐릭터 걷기: 시트는 열 = 방향, 줄 = 프레임 → 프레임 번호 = 줄 * 4 + 열
  for (const id of Object.keys(characters)) {
    const key = `char.${id}`;
    if (!scene.textures.exists(key) || A.exists(`${key}.down`)) continue;
    for (const [dir, col] of Object.entries(CHAR.dirs)) {
      A.create({ key: `${key}.${dir}`, frames: CHAR.walkRows.map((row) => ({ key, frame: row * CHAR.cols + col })), frameRate: 8, repeat: -1 });
    }
  }
  for (const [key, a] of Object.entries(ANIMATED)) {
    if (A.exists(`anim.${key}`)) continue;
    A.create({ key: `anim.${key}`, frames: A.generateFrameNumbers(`anim.${key}`, { start: 0, end: a.frames - 1 }), frameRate: a.rate, repeat: -1 });
  }
}

export const FACE_SIZE = FACE;
