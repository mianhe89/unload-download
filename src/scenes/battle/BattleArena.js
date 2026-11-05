// 싸움터 그림 (전투 장면 부품): 그 땅의 바닥을 필드와 같은 팩 타일로 굽고(MapRenderer), 둘레에 그 땅의 나무·바위를 세우고,
// 가장자리를 어둡게 눌러 싸울 자리를 또렷하게 한다. 그 땅에 내리는 것(눈·낙엽·불티·별)이 흩날린다.
// 싸움터 크기는 content/action/action.js의 ARENA. 바깥 둘레(MARGIN칸)는 걸을 수 없는 배경이다.
import { ARENA } from '../../../content/action/action.js';
import { OBJECTS } from '../../../content/art/pack.js';
import { BIOMES } from '../../../content/world/world.js';
import { THEME_OF, FLORA } from '../../world/buildArea.js';
import { MapRenderer, textureOf } from '../../field/MapRenderer.js';

const T = 16;
const MARGIN = 5; // 싸움터 둘레에 그리는 배경 칸 수
// 어두운 땅(동굴·용암·은하·그림자)은 가장자리를 더 짙게
const DARK = new Set(['cave', 'deepCave', 'lava', 'blackSnow', 'galaxy', 'shadow', 'ancientHall']);
// 그 땅에 내리는 것 (content/world/world.js의 BIOMES.falling). 그림자(정리자)는 재가 떠오른다
const FALLING = { shadow: 'ash' };

const rng = (seed) => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

export function themeOf(biome) {
  if (biome === 'shadow') return 'void';
  if (biome === 'village') return 'village';
  return THEME_OF[BIOMES[biome]?.floor] ?? 'grass';
}

// 바닥: 싸움터 안쪽에 흙(길) 얼룩 몇 개를 둔 가짜 맵을 MapRenderer로 굽는다
function groundMap(biome, seed) {
  const W = ARENA.w / T + MARGIN * 2, H = ARENA.h / T + MARGIN * 2;
  const r = rng(seed);
  const terrain = Array.from({ length: H }, () => Array(W).fill('g'));
  const blobs = 2 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i += 1) {
    const cx = MARGIN + 3 + r() * (W - MARGIN * 2 - 6), cy = MARGIN + 2 + r() * (H - MARGIN * 2 - 4);
    const rx = 2 + r() * 3.5, ry = 1.5 + r() * 2;
    for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d < 1 + Math.sin(x * 1.7 + y * 0.9 + i) * 0.25) terrain[y][x] = 'd';
    }
  }
  return { id: 'arena', W, H, FOG: 0, theme: themeOf(biome), terrain, objects: [], exits: [], isSolidTile: () => false, isSolidPx: () => false };
}

export class BattleArena {
  // container: 싸움터 좌표(0,0 = 싸움터 왼쪽 위)를 쓰는 그릇
  constructor(scene, container, biome, seed = 1) {
    this.scene = scene;
    this.c = container;
    this.biome = biome;
    this.seed = seed;
    this.layers = [];
    this.drawGround();
    this.drawBorder();
    this.drawShade();
    this.startFalling();
  }

  add(o) { this.c.add(o); this.layers.push(o); return o; }

  drawGround() {
    const sc = this.scene;
    const map = groundMap(this.biome, this.seed);
    const mr = new MapRenderer(sc, map);
    const key = mr.renderGround('battle.ground');
    mr.fog?.destroy(); // 싸움터엔 안개가 없다
    this.add(sc.add.image(-MARGIN * T, -MARGIN * T, key).setOrigin(0, 0));
  }

  // 둘레의 나무·바위: 싸움터 밖 띠에 그 땅의 것을 세운다 (안쪽으로 조금 걸쳐 경계가 자연스럽게)
  drawBorder() {
    const sc = this.scene;
    const fl = FLORA[this.biome] ?? (this.biome === 'village' ? FLORA.temperate : null);
    if (!fl) return;
    const types = [...fl.big, ...fl.big, ...fl.small].filter((t) => OBJECTS[t]);
    if (!types.length) return;
    const r = rng(this.seed * 31 + 7);
    const items = [];
    const put = (x, y) => {
      const t = types[Math.floor(r() * types.length)];
      const def = OBJECTS[t];
      const [, , w, h] = def.rect;
      items.push({ t, def, x: x - w / 2, y: y - h + 6, w, h });
    };
    // 위·아래 줄
    for (let x = -MARGIN * T + 8; x < ARENA.w + MARGIN * T; x += 26 + r() * 22) { put(x, -6 - r() * 18); put(x + r() * 10, ARENA.h + 34 + r() * 30); }
    // 왼쪽·오른쪽 줄
    for (let y = 10; y < ARENA.h + 30; y += 26 + r() * 20) { put(-22 - r() * 30, y); put(ARENA.w + 22 + r() * 30, y); }
    items.sort((a, b) => a.y + a.h - (b.y + b.h));
    for (const it of items) {
      if (it.def.foot) {
        const [fx, fy, fw, fh] = it.def.foot;
        this.add(sc.add.ellipse(it.x + fx + fw / 2, it.y + fy + fh - 2, fw * 0.95, Math.max(5, fh * 0.5), 0x10140c, 0.25));
      }
      this.add(sc.add.image(it.x, it.y, textureOf(it.def), it.t).setOrigin(0, 0));
    }
  }

  // 가장자리 그늘: 싸움터 밖은 짙게, 안쪽 가장자리는 옅게 — 싸울 자리가 빛을 받은 것처럼
  drawShade() {
    const sc = this.scene;
    const key = 'battle.shade';
    const M = MARGIN * T, w = ARENA.w + M * 2, h = ARENA.h + M * 2;
    if (sc.textures.exists(key)) sc.textures.remove(key);
    const tex = sc.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    const dark = DARK.has(this.biome);
    // 바깥: 싸움터 밖을 덮는다
    ctx.fillStyle = `rgba(8,6,12,${dark ? 0.72 : 0.5})`;
    ctx.fillRect(0, 0, w, h);
    ctx.clearRect(M, M, ARENA.w, ARENA.h);
    // 안쪽 가장자리를 둥글게 어둡게 (방사형)
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(ARENA.w, ARENA.h) * 0.32, w / 2, h / 2, Math.max(ARENA.w, ARENA.h) * 0.62);
    g.addColorStop(0, 'rgba(8,6,12,0)');
    g.addColorStop(1, `rgba(8,6,12,${dark ? 0.55 : 0.32})`);
    ctx.fillStyle = g;
    ctx.fillRect(M, M, ARENA.w, ARENA.h);
    // 싸움터 테두리: 가는 밝은 선 + 그림자
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(M - 1.5, M - 1.5, ARENA.w + 3, ARENA.h + 3);
    ctx.strokeStyle = dark ? 'rgba(180,140,255,0.18)' : 'rgba(255,240,200,0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(M + 0.5, M + 0.5, ARENA.w - 1, ARENA.h - 1);
    tex.refresh();
    this.shade = sc.add.image(-M, -M, key).setOrigin(0, 0);
    // 그늘은 사람·적 위에 와야 가장자리에서도 어둡다 — 장면이 나중에 맨 위로 올린다(raise)
  }

  raise() { if (this.shade) { this.c.add(this.shade); this.c.bringToTop(this.shade); } }

  // 흩날리는 것: 눈(천천히 내림)·낙엽(흔들리며)·불티(떠오름)·별(반짝임)·재(떠오르며 흐려짐)·비
  startFalling() {
    const kind = FALLING[this.biome] ?? BIOMES[this.biome]?.falling ?? null;
    if (!kind) return;
    const sc = this.scene;
    const spawn = () => {
      const x = -20 + Math.random() * (ARENA.w + 40);
      let o;
      if (kind === 'snow') {
        o = sc.add.circle(x, -10, 0.8 + Math.random() * 0.9, 0xffffff, 0.85);
        sc.tweens.add({ targets: o, y: ARENA.h + 10, x: x + (Math.random() - 0.5) * 40, duration: 5000 + Math.random() * 3000, onComplete: () => o.destroy() });
      } else if (kind === 'leaf') {
        o = sc.add.rectangle(x, -10, 2.5, 1.5, [0xd8803a, 0xc85a2a, 0xe8b040][Math.floor(Math.random() * 3)], 0.95);
        sc.tweens.add({ targets: o, y: ARENA.h + 10, x: x + 30 + Math.random() * 40, angle: 360 + Math.random() * 360, duration: 6000 + Math.random() * 3000, onComplete: () => o.destroy() });
      } else if (kind === 'ember' || kind === 'ash') {
        const y = ARENA.h + 6;
        o = sc.add.circle(x, y, 0.7 + Math.random() * 0.8, kind === 'ember' ? 0xffa040 : 0xb8a8d8, 0.9);
        sc.tweens.add({ targets: o, y: y - 80 - Math.random() * 120, x: x + (Math.random() - 0.5) * 30, alpha: 0, duration: 2600 + Math.random() * 1800, onComplete: () => o.destroy() });
      } else if (kind === 'star') {
        o = sc.add.circle(Math.random() * ARENA.w, Math.random() * ARENA.h, 0.6 + Math.random() * 0.6, 0xe8e0ff, 0);
        sc.tweens.add({ targets: o, alpha: 0.9, yoyo: true, duration: 700 + Math.random() * 600, onComplete: () => o.destroy() });
      } else if (kind === 'rain') {
        o = sc.add.rectangle(x, -10, 0.6, 5, 0xbfd8ff, 0.5).setAngle(12);
        sc.tweens.add({ targets: o, y: ARENA.h + 10, x: x - 20, duration: 700 + Math.random() * 300, onComplete: () => o.destroy() });
      }
      if (o) this.c.add(o);
    };
    const every = { snow: 90, leaf: 420, ember: 160, ash: 200, star: 140, rain: 30 }[kind] ?? 200;
    this.timer = sc.time.addEvent({ delay: every, loop: true, callback: spawn });
  }
}
