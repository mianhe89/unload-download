// 오른쪽 위 작은 지도. 늘 켜져 있고, + / - (또는 마우스 휠, 지도 옆 단추)로 넓게·좁게 본다.
// 지금 있는 맵(마을·길·건물 안)을 칸 하나 = 점 하나로 그린 바탕 위에, 나(금색)와 사람들(흰 점)을 찍는다.
// 지금 할 일이 남은 사람은 노란 점으로 — 어디로 가야 할지 눈으로 보인다.
// 바탕은 맵이 바뀔 때만 다시 그린다. 점은 0.2초마다.
import { COLORS, frame, text, scaleOf } from './kit.js';

const LEVELS = [18, 30, 48];       // 한 변에 보이는 칸 수 (가까이 → 멀리)
const GROUND = {                   // 테마별 바닥 색 [풀, 길]
  village: [0x4f7f36, 0xb08a52], grass: [0x6a9a3e, 0xb89058], snow: [0xdfe6ee, 0xb8c2cc], sand: [0xe0cf98, 0xc8ae78],
  earth: [0x9a7a58, 0x7a5c40], room: [0xc89a6a, 0xc89a6a], cave: [0x5a4a50, 0x6a5a5a], lava: [0x8a4a2a, 0xa05a30], void: [0x4a3a7a, 0x5a4a8a], sea: [0x3a6aa8, 0xd8c890],
};
const SOLID = 0x24361f, BUILDING = 0xc0603a, WATER = 0x3a6aa8, FOG = 0x2a2a34;

export class Minimap {
  constructor(scene) {
    this.scene = scene;
    const s = (this.s = scaleOf(scene));
    this.size = Math.round(150 * s);
    this.level = 1;
    const { width } = scene.scale;
    this.x0 = width - this.size - 14 * s;
    this.y0 = 82 * s; // 소리 단추 아래
    this.box = scene.add.container(0, 0).setDepth(45);
    const g = scene.add.graphics();
    frame(g, this.x0 - 6 * s, this.y0 - 6 * s, this.size + 12 * s, this.size + 12 * s, s, { corners: 'diamond', sheen: false, radius: 6 });
    this.img = scene.add.image(this.x0, this.y0, '__DEFAULT').setOrigin(0, 0).setVisible(false);
    this.dots = scene.add.graphics().setDepth(46); // 컨테이너 밖에 둔다 (마스크 낀 이미지 옆에 두면 그려지지 않았다)
    this.maskShape = scene.make.graphics({}, false).fillRect(this.x0, this.y0, this.size, this.size);
    const mask = this.maskShape.createGeometryMask();
    this.img.setMask(mask); // 점은 마스크 대신 테두리 안에 있을 때만 찍는다(Graphics에 마스크가 먹지 않는다)
    this.label = text(scene, this.x0 + this.size / 2, this.y0 + this.size + 12 * s, '', { size: 10, color: COLORS.sub }).setOrigin(0.5, 0.5);
    // 넓게·좁게 단추
    const btn = (dx, str, d) => text(scene, this.x0 + dx, this.y0 + this.size + 12 * s, str, { size: 13, color: COLORS.accent }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.zoom(d));
    this.box.add([g, this.img, this.label, btn(6 * s, '+', -1), btn(this.size - 6 * s, '−', 1)]);
    const kb = scene.input.keyboard;
    ['PLUS', 'NUMPAD_ADD'].forEach((k) => kb.on(`keydown-${k}`, () => this.zoom(-1)));
    ['MINUS', 'NUMPAD_SUBTRACT'].forEach((k) => kb.on(`keydown-${k}`, () => this.zoom(1)));
    kb.on('keydown', (e) => { if (e.key === '=') this.zoom(-1); });
    scene.input.on('wheel', (p, _o, _dx, dy) => {
      if (p.x >= this.x0 && p.x <= this.x0 + this.size && p.y >= this.y0 && p.y <= this.y0 + this.size) this.zoom(dy > 0 ? 1 : -1);
    });
    this.timer = 0;
    this.mapKey = null;
  }

  zoom(d) { this.level = Math.max(0, Math.min(LEVELS.length - 1, this.level + d)); this.timer = 0; }

  setVisible(v) { this.box.setVisible(v); this.dots.setVisible(v); }

  // 맵 바탕: 칸 하나 = 점 하나
  build(map, key) {
    const sc = this.scene;
    const texKey = `minimap.${key}`;
    if (!sc.textures.exists(texKey)) {
      const tex = sc.textures.createCanvas(texKey, map.W, map.H);
      const ctx = tex.getContext();
      const [grass, path] = GROUND[map.theme ?? 'village'] ?? GROUND.village;
      const buildings = new Set();
      for (const o of map.objects ?? []) if (o.name || o.residents || /^house|bakery|shop|forge|belltower/.test(o.type)) {
        for (let y = o.at[1] + 1; y < o.at[1] + 3; y += 1) for (let x = o.at[0]; x < o.at[0] + 4; x += 1) buildings.add(`${x},${y}`);
      }
      const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
      for (let y = 0; y < map.H; y += 1) for (let x = 0; x < map.W; x += 1) {
        const t = map.terrain?.[y]?.[x];
        const edge = x < map.FOG || y < map.FOG || x >= map.W - map.FOG || y >= map.H - map.FOG;
        let c = t === 'd' ? path : t === 'w' ? WATER : grass;
        if (map.isSolidTile?.(x, y)) c = buildings.has(`${x},${y}`) ? BUILDING : t === 'w' ? WATER : SOLID;
        if (edge && map.isSolidTile?.(x, y)) c = FOG;
        ctx.fillStyle = hex(c);
        ctx.fillRect(x, y, 1, 1);
      }
      tex.refresh();
    }
    this.img.setTexture(texKey).setVisible(true);
    this.mapKey = key;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.2;
    const sc = this.scene;
    const src = ['Field', 'Area'].map((k) => sc.scene.isActive(k) && sc.scene.get(k)).find((f) => f?.minimapInfo);
    const info = src?.minimapInfo?.();
    if (!info) { this.setVisible(false); return; }
    this.setVisible(true);
    if (info.key !== this.mapKey) this.build(info.map, info.key);
    // 보이는 칸 수 → 한 칸의 크기. 나를 가운데에 두되 맵 밖으로 나가지 않게
    const n = LEVELS[this.level], k = this.size / n;
    const { W, H } = info.map;
    const cx = Math.max(n / 2, Math.min(W - n / 2, info.player.x)), cy = Math.max(n / 2, Math.min(H - n / 2, info.player.y));
    const ox = W <= n ? (n - W) / 2 : n / 2 - cx, oy = H <= n ? (n - H) / 2 : n / 2 - cy;
    this.img.setScale(k).setPosition(this.x0 + ox * k, this.y0 + oy * k);
    const g = this.dots.clear();
    const at = (p) => [this.x0 + (ox + p.x) * k, this.y0 + (oy + p.y) * k];
    const inside = ([x, y]) => x >= this.x0 + 2 && x <= this.x0 + this.size - 2 && y >= this.y0 + 2 && y <= this.y0 + this.size - 2;
    for (const p of info.people) {
      const [x, y] = at(p);
      if (!inside([x, y])) continue;
      const r = Math.max(2.6 * this.s, k * 0.4);
      g.fillStyle(0x000000, 0.55).fillCircle(x, y + this.s, r + this.s);
      g.fillStyle(p.task ? 0xffd84a : p.foe ? 0xe05a4a : 0xf4f0e8, 1).fillCircle(x, y, r);
    }
    const [px, py] = at(info.player);
    const r = Math.max(3.6 * this.s, k * 0.55);
    g.fillStyle(0x000000, 0.65).fillCircle(px, py + this.s, r + 1.5 * this.s);
    g.fillStyle(0xf8d070, 1).fillCircle(px, py, r);
    g.lineStyle(1 * this.s, 0xffffff, 0.9).strokeCircle(px, py, r);
    this.label.setText(info.name ?? '');
  }
}
