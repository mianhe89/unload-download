// 전체 지도 (M): 오른쪽 위 작은 지도가 지금 맵을 보여 준다면, 이 창은 세계 전체(content/world/world.js)를 보여 준다.
//   칸 하나 = 맵(구역) 하나. 길·거점·곁가지 구역만 그 땅 색으로 칠하고, 그 밖은 '흐릿한 가장자리'로 어둡게 둔다.
//   가 본 칸은 또렷하게, 안 가 본 칸은 안개를 덮는다. 마을 이름은 직접 가 보기 전까지 깨져 있다(이정표와 같은 규칙).
//   나(금색 점, 깜빡임), 지금 할 일의 목적지(금색 별). 층(지상·지하·은하)은 가 본 층만 Q·E로 넘긴다.
// 열려 있는 동안 주인공은 멈춘다. M·Esc 닫기.
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { LAYERS, HUBS, SIDES, biomeAt, cells, links, cellKey } from '../../content/world/world.js';
import { hubOfMap, trackedStep } from '../field/goals.js';
import { corrupt } from '../core/script/speech.js';
import { worldDate } from '../core/util/worldTime.js';
import { season as seasonOf } from '../core/util/daily.js';

const BIOME_COLOR = {
  blackSnow: 0x4a4e5c, snow: 0xe6ecf2, frost: 0xb4c8d6, lateAutumn: 0xc89a58, deepForest: 0x2e5a2a, dry: 0xb08a5a,
  desert: 0xe0c890, temperate: 0x7aa84a, coast: 0xe8d8a0, sea: 0x3a6aa8, volcano: 0xb0401e,
  cave: 0x6a5a60, deepCave: 0x4a3e44, lava: 0xc04a1a, ancientHall: 0x9a8a62, galaxy: 0x5a4a9a,
};
const shade = (c, f) => { const m = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return (m((c >> 16) & 255) << 16) | (m((c >> 8) & 255) << 8) | m(c & 255); };

export class WorldMapPanel {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.box = null;
    this.layer = 'surface';
    const keys = scene.input.keyboard;
    keys.on('keydown-M', () => this.toggle());
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    on('ESC', () => this.close());
    on('Q', () => this.turn(-1));
    on('E', () => this.turn(1));
  }

  get open() { return Boolean(this.box); }

  field() {
    for (const key of ['Field', 'Area']) if (this.scene.scene.isActive(key)) return this.scene.scene.get(key);
    return null;
  }

  // 다른 창이 열려 있거나 대화 중이면 열지 않는다
  toggle() {
    if (this.open) { this.close(); return; }
    const ui = this.scene;
    if (!WorldMemory.run || !this.field() || ui.bag?.open || ui.notebook?.open || ui.status?.open || ui.pause?.open || ui.dialog?.open || ui.choice?.open) return;
    this.layer = this.here()?.layer ?? 'surface';
    this.field()?.setFrozen?.(true);
    this.render();
  }

  close() { this.box?.destroy(); this.box = null; this.timer?.remove(); this.field()?.setFrozen?.(false); }

  // 가 본 층만 넘긴다 (은하는 가 보기 전까지 지도에 없다)
  layers() {
    const flags = WorldMemory.run.flags;
    return Object.keys(LAYERS).filter((l) => l === 'surface' || l === this.here()?.layer || Object.keys(flags).some((f) => f.startsWith(`visited.${l}:`)));
  }

  turn(d) {
    const ls = this.layers();
    this.layer = ls[(ls.indexOf(this.layer) + d + ls.length) % ls.length];
    this.render();
  }

  // 지금 있는 곳: 길 맵이면 그 칸, 마을(이야기 필드)이면 그 거점
  here() {
    const f = this.field();
    if (!f) return null;
    if (f.layerId && f.at) return { layer: f.layerId, at: f.at };
    const hub = HUBS[hubOfMap(f.mapDef?.id)];
    return hub ? { layer: hub.layer ?? 'surface', at: hub.at } : null;
  }

  visited(layer, at, hubId) {
    const flags = WorldMemory.run.flags;
    return hubId === 'home' || Boolean(flags[`visited.${cellKey(layer, at)}`] || (hubId && flags[`visited.${hubId}`]));
  }

  render() {
    this.box?.destroy();
    this.timer?.remove();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const L = LAYERS[this.layer];
    const W = 600 * s, H = 500 * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(210));
    box.add(sc.add.rectangle(0, 0, width, height, 0x000000, 0.45).setOrigin(0, 0).setInteractive());
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false });
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, '세계 지도', s));

    // 칸 크기: 층 전체가 창 안에 들어가게
    const areaW = W - 60 * s, areaH = H - 110 * s;
    const C = Math.floor(Math.min(areaW / L.W, areaH / L.H));
    const gx = width / 2 - (C * L.W) / 2, gy = y0 + 48 * s + (areaH - C * L.H) / 2;
    const cx = (x) => gx + x * C + C / 2, cy = (y) => gy + y * C + C / 2;
    const season = seasonOf(worldDate(WorldMemory.run));
    const all = [...cells().values()].filter((c) => c.layer === this.layer);
    const known = new Set(all.map((c) => `${c.at}`));

    // 땅: 길 밖은 흐릿한 가장자리
    for (let y = 0; y < L.H; y += 1) for (let x = 0; x < L.W; x += 1) {
      const col = BIOME_COLOR[biomeAt(x, y, season, this.layer)] ?? 0x555555;
      g.fillStyle(known.has(`${[x, y]}`) ? col : shade(col, 0.35), 1).fillRect(gx + x * C, gy + y * C, C, C);
    }
    g.fillStyle(0x15151c, 0.25).fillRect(gx, gy, C * L.W, C * L.H);
    // 길: 이웃한 칸끼리 선
    const adj = links();
    g.lineStyle(Math.max(2, 3 * s), 0xf4e4c0, 0.85);
    for (const [k, ns] of adj) for (const n of ns) {
      if (k > n) continue;
      const [la, a] = k.split(':'), [lb, b] = n.split(':');
      if (la !== this.layer || lb !== this.layer) continue;
      const [ax, ay] = a.split(',').map(Number), [bx, by] = b.split(',').map(Number);
      g.lineBetween(cx(ax), cy(ay), cx(bx), cy(by));
    }
    // 안 가 본 칸은 안개
    for (const c of all) {
      const hubId = c.kind === 'hub' ? c.id : null;
      if (!this.visited(c.layer, c.at, hubId)) g.fillStyle(0xe8e4f0, 0.32).fillRect(gx + c.at[0] * C + 1, gy + c.at[1] * C + 1, C - 2, C - 2);
    }
    g.lineStyle(1 * s, 0x000000, 0.5).strokeRect(gx, gy, C * L.W, C * L.H);

    // 거점과 곁가지 구역
    const label = (x, y, str, color) => box.add(text(sc, x, y, str, { size: 9, bold: true, color }).setOrigin(0.5, 0).setStroke('#15151c', 3 * s));
    for (const [id, h] of Object.entries(HUBS)) {
      if ((h.layer ?? 'surface') !== this.layer) continue;
      const seen = this.visited(this.layer, h.at, id);
      const x = cx(h.at[0]), y = cy(h.at[1]), r = Math.max(5 * s, C * 0.32);
      g.fillStyle(0x15151c, 1).fillPoints([{ x, y: y - r - 1.5 * s }, { x: x + r + 1.5 * s, y }, { x, y: y + r + 1.5 * s }, { x: x - r - 1.5 * s, y }], true);
      g.fillStyle(seen ? 0xf8d070 : 0x9a94a8, 1).fillPoints([{ x, y: y - r }, { x: x + r, y }, { x, y: y + r }, { x: x - r, y }], true);
      const name = id === 'home' ? '우리 마을' : h.name; // 거점 이름표의 '수확제 마을'은 작업용 가칭
      label(x, y + r + 2 * s, seen ? name : corrupt(name), seen ? COLORS.text : COLORS.dim);
    }
    for (const sd of Object.values(SIDES)) {
      if ((sd.layer ?? 'surface') !== this.layer) continue;
      const seen = this.visited(this.layer, sd.at);
      const x = cx(sd.at[0]), y = cy(sd.at[1]);
      g.fillStyle(0x15151c, 1).fillCircle(x, y, Math.max(3.5 * s, C * 0.18) + 1.2 * s);
      g.fillStyle(seen ? 0x9ad0ff : 0x7a7488, 1).fillCircle(x, y, Math.max(3.5 * s, C * 0.18));
      if (seen) label(x, y + C * 0.22, sd.name, '#c8e4ff');
    }

    // 목적지: 지금 할 일이 다른 거점에 있으면 별
    const step = trackedStep(WorldMemory.run.quests);
    const places = [step?.goal].flat().filter((q) => q?.place).map((q) => HUBS[q.place]).filter((h) => h && (h.layer ?? 'surface') === this.layer);
    if (places[0]) this.star(g, cx(places[0].at[0]) + C * 0.36, cy(places[0].at[1]) - C * 0.36, 6 * s);

    // 나: 깜빡이는 금색 점
    const me = this.here();
    if (me?.layer === this.layer) {
      const dot = sc.add.graphics();
      const x = cx(me.at[0]), y = cy(me.at[1]);
      dot.fillStyle(0x000000, 0.6).fillCircle(x, y + s, 6 * s);
      dot.fillStyle(0xffd84a, 1).fillCircle(x, y, 5 * s);
      dot.lineStyle(1.5 * s, 0xffffff, 1).strokeCircle(x, y, 5 * s);
      box.add(dot);
      this.timer = sc.time.addEvent({ delay: 450, loop: true, callback: () => dot.setVisible(!dot.visible) });
    }

    // 아랫줄: 층 이름과 범례
    const ls = this.layers();
    const tabs = ls.map((l) => (l === this.layer ? `[ ${LAYERS[l].name} ]` : LAYERS[l].name)).join('   ');
    box.add(text(sc, x0 + 24 * s, y0 + H - 28 * s, ls.length > 1 ? `${tabs}   (Q·E)` : LAYERS[this.layer].name, { size: 11, bold: true, color: COLORS.accent }).setOrigin(0, 0.5));
    box.add(text(sc, x0 + W - 24 * s, y0 + H - 28 * s, '◆ 마을   ● 곁가지   ★ 목적지   M 닫기', { size: 10, color: COLORS.sub }).setOrigin(1, 0.5));
  }

  star(g, x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i += 1) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; pts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr }); }
    g.fillStyle(0xffd84a, 1).fillPoints(pts, true);
    g.lineStyle(1 * this.s, 0x5a3a10, 1).strokePoints(pts, true);
  }
}
