// 오른쪽 위 작은 지도. 늘 켜져 있고, + / - (또는 마우스 휠, 지도 옆 단추)로 넓게·좁게 본다.
// 지금 있는 맵(마을·길·건물 안)을 칸 하나 = 점 하나로 그린 바탕 위에, 나(금색)와 사람들(흰 점)을 찍는다.
// 지금 할 일이 남은 사람은 노란 점으로 — 어디로 가야 할지 눈으로 보인다.
// 바탕은 맵이 바뀔 때만 다시 그린다(칸 하나 = 4×4 화소: 풀결·나무 덩이·지붕 색·건물 외곽선). 점은 0.2초마다.
// 이름 있는 건물엔 무엇을 하는 곳인지 작은 그림 휘장이 붙는다(종탑 종, 잡화점 물약, 대장간 칼과 방패…).
// 주인이 지워져 세상이 이름을 모르는 집(빈 가게, 빈 대장간)엔 휘장이 없다.
import { text, scaleOf } from './kit.js';
import { OBJECTS } from '../../content/art/pack.js';
import { MAP_ICONS, iconFor } from '../../content/art/mapIcons.js';

const TPX = 4;                     // 지도 바탕에서 칸 하나의 화소 수
const ROOF = {                     // 건물 종류별 지붕 색 (필드 그림의 지붕과 같은 계열)
  house_red: 0xb8483a, house_orange: 0xd07a38, house_wood: 0x8a5a34, house_stone: 0x8a8a94, house_plain: 0xa88a5a,
  house_tall: 0x5a5a7a, bakery: 0xd8944a, shop: 0x4a7ab8, belltower: 0x9a9aa8, forge: 0x5a5058,
};
const LEVELS = [18, 30, 48];       // 한 변에 보이는 칸 수 (가까이 → 멀리)
const GROUND = {                   // 테마별 바닥 색 [풀, 길]
  village: [0x4f7f36, 0xb08a52], grass: [0x6a9a3e, 0xb89058], snow: [0xdfe6ee, 0xb8c2cc], sand: [0xe0cf98, 0xc8ae78],
  earth: [0x9a7a58, 0x7a5c40], room: [0xc89a6a, 0xc89a6a], cave: [0x5a4a50, 0x6a5a5a], lava: [0x8a4a2a, 0xa05a30], void: [0x4a3a7a, 0x5a4a8a], sea: [0x3a6aa8, 0xd8c890],
};
const SOLID = 0x24361f, BUILDING = 0xc0603a, WATER = 0x3a6aa8, FOG = 0x2a2a34;

// 테두리: 순백 종이(대화창과 같은 결) + 안쪽 가는 선만 그 지역 색
const PAPER = { body: 0xfbf8f2, shade: 0xe4dccd, ink: '#3a2a28', edge: 0x2a2026 };
const ACCENT_BY_MAP = {
  village: 0xd8a040, neighbor: 0xd86a6a, ruin: 0x8a8278, frost: 0x6aa8e0, harbor: 0x3a8ac8, dwarf: 0xc8783a, elf: 0x5aa05a,
  mill: 0x9ab84a, lordtown: 0x8a5ac0, myhome: 0xb87848, ledger: 0x5a6ab8, icecastle: 0x8ac8ec,
};
const ACCENT_BY_THEME = { snow: 0x6aa8e0, sand: 0xd8b060, earth: 0x9a8a6a, cave: 0x8a6a7a, lava: 0xd0603a, void: 0x9a7ae0, sea: 0x3a8ac8 };

// 이 게임의 문장: 적붉은 까마귀 (기억의 새, 마스코트). 검은 몸, 짙은 붉은 날개깃, 붉은 눈
const CROW = [
  '....................',
  '..........kkk.......',
  '.........kkkkk......',
  '........kkkRkkbb....',
  '........kkkkkk......',
  '.rr....kkkkkkk......',
  '.rrr..kkkkkkkk......',
  '..rrrkkkkkkkkk......',
  '...rrrkkkkrrkk......',
  '....rkkkkrrrrk......',
  '.....kkkkkrrk.......',
  '......kkkkkk........',
  '........k..k........',
  '.......kk..kk.......',
];
const CROW_PAL = { k: '#1c1216', r: '#7a1a24', R: '#e03a3a', b: '#4a4048' };

export class Minimap {
  constructor(scene) {
    this.scene = scene;
    const s = (this.s = scaleOf(scene));
    this.size = Math.round(150 * s);
    this.level = 1;
    const { width } = scene.scale;
    // 오른쪽 위 모서리에 붙인다 (소리 단추는 그 왼쪽, ui/SoundButton.js)
    this.x0 = width - this.size - 5 * s;
    this.y0 = 13 * s; // 윗줄 까마귀 메달이 화면 밖으로 잘리지 않을 만큼만 내린다
    this.box = scene.add.container(0, 0).setDepth(45);
    const g = (this.frameG = scene.add.graphics());
    this.img = scene.add.image(this.x0, this.y0, '__DEFAULT').setOrigin(0, 0).setVisible(false);
    this.badgeG = scene.add.graphics().setDepth(46); // 건물 휘장 바탕
    this.dots = scene.add.graphics().setDepth(47); // 컨테이너 밖에 둔다 (마스크 낀 이미지 옆에 두면 그려지지 않았다)
    // 지도 그림은 마스크 대신 보이는 칸만 잘라 쓴다(setCrop) — 이 판본의 Phaser에선 마스크가 먹지 않아 테두리 밖으로 넘쳤다
    // 지도 아래쪽 안의 얇은 띠: 이름과 넓게·좁게 단추
    const stripY = this.y0 + this.size - 7 * s;
    this.strip = scene.add.rectangle(this.x0, stripY - 7 * s, this.size, 14 * s, 0x15151c, 0.62).setOrigin(0, 0);
    this.label = text(scene, this.x0 + this.size / 2, stripY, '', { size: 9, bold: true, color: '#fbf8f2' }).setOrigin(0.5, 0.5);
    const btn = (dx, str, d) => text(scene, this.x0 + dx, stripY, str, { size: 11, bold: true, color: '#fbf8f2' }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.zoom(d));
    // 까마귀 문장 (윗줄 가운데)
    if (!scene.textures.exists('ui.crow')) {
      const tex = scene.textures.createCanvas('ui.crow', CROW[0].length, CROW.length);
      const ctx = tex.getContext();
      CROW.forEach((row, y) => [...row].forEach((ch, x) => { if (CROW_PAL[ch]) { ctx.fillStyle = CROW_PAL[ch]; ctx.fillRect(x, y, 1, 1); } }));
      tex.refresh();
    }
    this.medal = scene.add.graphics();
    this.crow = scene.add.image(this.x0 + this.size / 2, this.y0 - 2 * s, 'ui.crow').setScale(Math.max(1, Math.round(1.4 * s))).setOrigin(0.5, 0.5);
    this.box.add([g, this.img, this.medal, this.crow, this.strip, this.label, btn(8 * s, '+', -1), btn(this.size - 8 * s, '−', 1)]);
    this.drawFrame(ACCENT_BY_MAP.village);
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

  // 테두리: 얇은 띠 — 어두운 바깥선 · 흰 띠 · 지역 색 안쪽선. 윗줄 가운데엔 작은 까마귀 메달
  drawFrame(accent) {
    if (this.accent === accent) return;
    this.accent = accent;
    const g = this.frameG.clear(), s = this.s, x = this.x0, y = this.y0, n = this.size;
    g.fillStyle(0x000000, 0.3).fillRect(x - 3 * s, y - 2 * s, n + 6 * s, n + 6 * s);
    g.fillStyle(PAPER.edge, 1).fillRect(x - 3.5 * s, y - 3.5 * s, n + 7 * s, n + 7 * s);
    g.fillStyle(PAPER.body, 1).fillRect(x - 2.5 * s, y - 2.5 * s, n + 5 * s, n + 5 * s);
    g.fillStyle(accent, 1).fillRect(x - 1 * s, y - 1 * s, n + 2 * s, n + 2 * s);
    g.fillStyle(0x15151c, 1).fillRect(x, y, n, n);
    const m = this.medal.clear(), cx = x + n / 2, cy = y - 2 * s, mr = 10 * s;
    m.fillStyle(PAPER.edge, 1).fillCircle(cx, cy, mr + 1 * s);
    m.fillStyle(PAPER.body, 1).fillCircle(cx, cy, mr);
    m.lineStyle(1 * s, accent, 1).strokeCircle(cx, cy, mr - 2 * s);
  }

  star(g, x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr }); }
    g.fillStyle(0x000000, 0.6).fillPoints(pts.map((p) => ({ x: p.x + this.s, y: p.y + this.s })), true);
    g.fillStyle(0xffd84a, 1).fillPoints(pts, true);
    g.lineStyle(1 * this.s, 0x5a3a10, 1).strokePoints(pts, true);
  }

  arrow(g, x, y, ang, r) {
    const p = (a, d) => ({ x: x + Math.cos(ang + a) * d, y: y + Math.sin(ang + a) * d });
    const pts = [p(0, r), p(2.5, r * 0.8), p(-2.5, r * 0.8)];
    g.fillStyle(0x000000, 0.6).fillPoints(pts.map((q) => ({ x: q.x + this.s, y: q.y + this.s })), true);
    g.fillStyle(0xffd84a, 1).fillPoints(pts, true);
    g.lineStyle(1 * this.s, 0x5a3a10, 1).strokePoints(pts, true);
  }

  // 휘장 그림: 한 번 텍스처로 만들어 두고, 그림 객체는 돌려 쓴다
  badge(i, icon) {
    const sc = this.scene, key = `mmicon.${icon}`;
    if (!sc.textures.exists(key)) {
      const { pal, rows } = MAP_ICONS[icon];
      const tex = sc.textures.createCanvas(key, rows[0].length, rows.length);
      const ctx = tex.getContext();
      rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x, y, 1, 1); } }));
      tex.refresh();
    }
    this.badges ??= [];
    while (this.badges.length <= i) this.badges.push(sc.add.image(0, 0, key).setDepth(46.5).setScale(Math.max(1, Math.round(1.2 * this.s))));
    const img = this.badges[i];
    if (img.texture.key !== key) img.setTexture(key);
    return img;
  }

  zoom(d) { this.level = Math.max(0, Math.min(LEVELS.length - 1, this.level + d)); this.timer = 0; }

  setVisible(v) { this.box.setVisible(v); this.dots.setVisible(v); this.badgeG.setVisible(v); if (!v) for (const b of this.badges ?? []) b.setVisible(false); }

  // 맵 바탕: 칸 하나 = 점 하나
  build(map, key) {
    const sc = this.scene;
    const texKey = `minimap.${key}`;
    if (!sc.textures.exists(texKey)) {
      const P = TPX;
      const tex = sc.textures.createCanvas(texKey, map.W * P, map.H * P);
      const ctx = tex.getContext();
      const [grass, path] = GROUND[map.theme ?? 'village'] ?? GROUND.village;
      const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
      const shade = (c, f) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, m = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return (m(r) << 16) | (m(g) << 8) | m(b); };
      const px = (x, y, c) => { ctx.fillStyle = hex(c); ctx.fillRect(x, y, 1, 1); };
      const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
      // 건물: 그림 사각형 그대로(지붕까지) 덮는다
      const roofs = [];
      for (const o of map.objects ?? []) {
        const def = OBJECTS[o.type];
        if (!def || !(o.name || o.residents || ROOF[o.type])) continue;
        roofs.push({ x: o.at[0] * P, y: o.at[1] * P, w: Math.round((def.rect[2] / 16) * P), h: Math.round((def.rect[3] / 16) * P), c: ROOF[o.type] ?? BUILDING });
      }
      for (let y = 0; y < map.H; y += 1) for (let x = 0; x < map.W; x += 1) {
        const t = map.terrain?.[y]?.[x];
        const solid = map.isSolidTile?.(x, y);
        const edge = x < map.FOG || y < map.FOG || x >= map.W - map.FOG || y >= map.H - map.FOG;
        let c = t === 'd' ? path : t === 'w' ? WATER : grass;
        if (solid && edge) c = FOG;
        else if (solid && t !== 'w') c = SOLID;
        ctx.fillStyle = hex(c);
        ctx.fillRect(x * P, y * P, P, P);
        // 결: 풀포기·물결·나무 덩이
        const h = hash(x, y);
        if (c === grass) { px(x * P + (h % P), y * P + ((h >> 3) % P), shade(grass, 1.12)); if (h % 5 === 0) px(x * P + ((h >> 6) % P), y * P + ((h >> 9) % P), shade(grass, 0.88)); }
        else if (c === path) { if (h % 3 === 0) px(x * P + (h % P), y * P + ((h >> 3) % P), shade(path, 0.9)); }
        else if (c === WATER) { if (h % 2) { ctx.fillStyle = hex(shade(WATER, 1.25)); ctx.fillRect(x * P + (h % 2), y * P + 1 + ((h >> 2) % 2), 2, 1); } }
        else if (c === SOLID) {
          ctx.fillStyle = hex(shade(0x3a6a2e, 0.95)); ctx.fillRect(x * P + 1, y * P, P - 2, P); ctx.fillRect(x * P, y * P + 1, P, P - 2);
          px(x * P + 1, y * P + 1, 0x5a8a3e);
        }
      }
      // 밭: 밀은 금빛, 그루터기는 짚색 줄, 논은 물빛, 채소는 초록 고랑
      for (const f of map.crops ?? []) for (let y = f.y; y < f.y + f.h; y += 1) for (let x = f.x; x < f.x + f.w; x += 1) {
        const row = y - f.y;
        const c = f.kind === 'wheat' ? 0xe8b848 : f.kind === 'stubble' ? (row % 2 ? null : 0xd8c088) : f.kind === 'paddy' ? (row % 3 === 2 ? null : 0x6a9ab0) : (row % 2 ? null : 0x6aa04a);
        if (c === null) continue;
        ctx.fillStyle = hex(c); ctx.fillRect(x * P, y * P + 1, P, P - 2);
      }
      // 지붕: 바깥 어두운 선, 위쪽 밝은 줄, 아래쪽 그늘
      for (const r of roofs) {
        ctx.fillStyle = hex(0x1c1418); ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = hex(r.c); ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        ctx.fillStyle = hex(shade(r.c, 1.25)); ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, 1);
        ctx.fillStyle = hex(shade(r.c, 0.7)); ctx.fillRect(r.x + 1, r.y + r.h - 3, r.w - 2, 2);
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
    if (info.key !== this.mapKey) {
      this.build(info.map, info.key);
      this.drawFrame(ACCENT_BY_MAP[info.map.id] ?? ACCENT_BY_THEME[info.map.theme] ?? ACCENT_BY_MAP.village);
    }
    // 보이는 칸 수 → 한 칸의 크기. 나를 가운데에 두되 맵 밖으로 나가지 않게
    // 보이는 칸 수는 맵의 짧은 쪽을 넘지 않는다 → 어느 단계에서도 지도가 테두리를 꽉 채운다(빈 띠 없음)
    const { W, H } = info.map;
    const n = Math.min(LEVELS[this.level], W, H), k = this.size / n, P = TPX;
    const cx = Math.max(n / 2, Math.min(W - n / 2, info.player.x)), cy = Math.max(n / 2, Math.min(H - n / 2, info.player.y));
    const ox = W <= n ? (n - W) / 2 : n / 2 - cx, oy = H <= n ? (n - H) / 2 : n / 2 - cy;
    this.img.setScale(k / P).setPosition(this.x0 + ox * k, this.y0 + oy * k);
    const kx = Math.max(0, -ox), ky = Math.max(0, -oy);
    this.img.setCrop(kx * P, ky * P, Math.min(n, W - kx) * P, Math.min(n, H - ky) * P);
    const g = this.dots.clear();
    const at = (p) => [this.x0 + (ox + p.x) * k, this.y0 + (oy + p.y) * k];
    const inside = ([x, y]) => x >= this.x0 + 2 && x <= this.x0 + this.size - 2 && y >= this.y0 + 2 && y <= this.y0 + this.size - 2;
    // 건물 휘장 (사람 점보다 아래)
    let used = 0;
    const bg = this.badgeG.clear();
    for (const b of info.buildings ?? []) {
      const icon = iconFor(b.name);
      if (!icon) continue;
      const [x, y] = at(b);
      if (!inside([x, y])) continue;
      const img = this.badge(used++, icon);
      const R = 6.5 * this.s;
      bg.fillStyle(0x000000, 0.45).fillCircle(x, y + this.s, R + 1.2 * this.s);
      bg.fillStyle(0x2a2026, 1).fillCircle(x, y, R + 1 * this.s);
      bg.fillStyle(0xfbf8f2, 1).fillCircle(x, y, R);
      img.setPosition(x, y).setVisible(true);
    }
    for (let i = used; i < this.badges.length; i += 1) this.badges[i].setVisible(false);
    for (const p of info.people) {
      const [x, y] = at(p);
      if (!inside([x, y])) continue;
      const r = Math.max(2.6 * this.s, k * 0.4);
      g.fillStyle(0x000000, 0.55).fillCircle(x, y + this.s, r + this.s);
      g.fillStyle(p.task ? 0xffd84a : p.foe ? 0xe05a4a : 0xf4f0e8, 1).fillCircle(x, y, r);
    }
    // 목적지: 같은 맵이면 금색 별(보이는 범위 밖이면 가장자리 화살표), 다른 마을이면 그쪽 가장자리 화살표
    if (info.goal) {
      const cx0 = this.x0 + this.size / 2, cy0 = this.y0 + this.size / 2;
      const pulse = 1 + 0.15 * Math.sin(sc.time.now / 180);
      if (info.goal.angle === undefined && inside(at(info.goal))) this.star(g, ...at(info.goal), 5 * this.s * pulse);
      else {
        const ang = info.goal.angle ?? Math.atan2(at(info.goal)[1] - cy0, at(info.goal)[0] - cx0);
        const r = this.size / 2 - 9 * this.s;
        const ex = cx0 + Math.cos(ang) * r, ey = cy0 + Math.sin(ang) * r;
        this.arrow(g, ex, ey, ang, 7 * this.s * pulse);
      }
    }
    const [px, py] = at(info.player);
    const r = Math.max(3.6 * this.s, k * 0.55);
    g.fillStyle(0x000000, 0.65).fillCircle(px, py + this.s, r + 1.5 * this.s);
    g.fillStyle(0xf8d070, 1).fillCircle(px, py, r);
    g.lineStyle(1 * this.s, 0xffffff, 0.9).strokeCircle(px, py, r);
    this.label.setText(info.name ?? '');
  }
}
