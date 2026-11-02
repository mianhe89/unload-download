// 마을 밖 길 맵. 전체 지도(content/world/world.js)의 칸 하나를 걸어 다닌다.
// 이야기 컷신은 없고(아직), 기후·빛·떨어지는 것만 있다. 맵 끝 출구를 밟으면 이웃 칸으로.
// 시작 마을 칸으로 돌아가면 이야기 필드(Field)로 돌아간다.
import Phaser from 'phaser';
import { ZOOM, TALK_RANGE } from '../../config/game.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { season } from '../../core/util/daily.js';
import { HUBS, BIOMES, cellKey, biomeAt } from '../../../content/world/world.js';
import { OBJECTS } from '../../../content/art/pack.js';
import { signText, fillText, ringBell, lowTide } from '../../world/features.js';
import { buildArea, OPPOSITE } from '../../world/buildArea.js';
import { MapRenderer } from '../../field/MapRenderer.js';
import { Player } from '../../field/Player.js';
import { Lighting } from '../../field/Lighting.js';
import { Ambient } from '../../field/Ambient.js';

const HOME = cellKey('surface', HUBS.home.at);
const FACE = { n: 'down', s: 'up', w: 'right', e: 'left' };
const FALLING = { snow: 'snow', leaf: 'leaf', rain: 'rain', star: 'snow' }; // 은하의 별가루는 눈 입자로

export default class AreaScene extends Phaser.Scene {
  constructor() { super('Area'); }

  // layer, at: 전체 지도의 칸. entry: 들어오는 쪽. back: 마을로 돌아갈 때의 { chapter, phase, time }
  init({ layer = 'surface', at, entry, back }) {
    this.layerId = layer;
    this.at = at;
    this.entryDir = entry;
    this.back = back;
    this.leaving = false;
    this.cooldown = 0;
    this.rings = 0;
  }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui = this.scene.get('UI');
    const area = (this.area = buildArea(this.layerId, this.at, { season: season(new Date()), lowTide: lowTide(new Date()) }));
    this.key = area.key;

    this.map = new MapRenderer(this, area, { open: area.exits.map((e) => e.dir) });
    this.add.image(0, 0, this.map.renderGround('area.ground')).setOrigin(0).setDepth(-1000);
    this.map.placeObjects();

    const [tx, ty] = area.entry(this.entryDir);
    this.player = new Player(this, tx, ty, FACE[this.entryDir] ?? 'down');
    // 바다에선 배를 타고 있다
    if (area.sea) this.boat = this.add.image(this.player.x, this.player.y, 'sheet.water', 'boat').setOrigin(0.5, 0.6);

    // 살펴볼 거리: 그림의 아래쪽 가운데가 서는 자리
    this.features = area.features.map((f) => {
      const [, , w, h] = OBJECTS[f.type].rect;
      return { ...f, x: f.at[0] * 16 + w / 2, y: f.at[1] * 16 + h };
    });

    // 지하와 은하는 늘 어둡다
    const time = this.layerId === 'surface' ? (this.back?.time ?? 'day') : 'night';
    const erased = WorldMemory.world.erased.length;
    this.lighting = new Lighting(this, { time, lights: [], erasedCount: erased, spots: area.spots, width: this.map.width, height: this.map.height });
    this.ambient = new Ambient(this, { time, map: area, erasedCount: erased, falling: FALLING[BIOMES[area.biome].falling] ?? null });

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, this.map.width, this.map.height).startFollow(this.player.sprite, true, 0.15, 0.15).setRoundPixels(true);
    cam.fadeIn(350, 0, 0, 0);

    // 처음 와 본 곳이면 그곳의 설명이 허공에 떠오른다
    const first = !WorldMemory.run.flags[`visited.${this.key}`];
    WorldMemory.setFlag(`visited.${this.key}`);
    this.time.delayedCall(0, () => {
      this.ui.toScreen = (x, y) => this.worldToScreen(x, y);
      this.ui.bubbles.clear();
      this.ui.hud.setPlace(area.name);
      this.ui.hud.setObjective(null);
      this.ui.hud.showPrompt(null);
      if (first && area.note) this.ui.bubbles.narrate(this.player, area.note, 4200);
    });
  }

  update(_, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.player.update(dt, (x, y) => this.area.isSolidPx(x, y));
    this.player.sync();
    if (this.boat) this.boat.setPosition(Math.round(this.player.x), Math.round(this.player.y + 2)).setDepth(this.player.y - 1);
    this.lighting.follow(this.player.x, this.player.y);
    this.lighting.update(dt);
    if (this.leaving || this.ui.talking || this.player.frozen) { this.ui.hud.showPrompt(null); return; }
    const e = this.area.exitAt(this.player.x, this.player.y);
    if (e) { this.go(e); return; }
    // 계단을 밟으면 다른 층으로
    const tx = Math.floor(this.player.x / 16), ty = Math.floor(this.player.y / 16);
    const stairs = this.features.find((f) => f.kind === 'portal' && f.at[0] === tx && f.at[1] === ty);
    if (stairs) { this.through(stairs.to); return; }
    this.updateInteraction();
  }

  // 가까운 살펴볼 거리 → E
  updateInteraction() {
    let best = null, bestD = TALK_RANGE + 6;
    for (const f of this.features) {
      if (f.kind === 'portal') continue;
      const d = Math.hypot(f.x - this.player.x, f.y - this.player.y);
      if (d < bestD) { best = f; bestD = d; }
    }
    this.ui.hud.showPrompt(best ? this.worldToScreen(best.x, best.y - 22) : null);
    if (!best || this.cooldown > 0 || !this.player.justPressed('act')) return;
    this.examine(best);
  }

  async say(text) {
    this.player.frozen = true;
    await this.ui.say('', '#cfc9dd', text);
    this.ui.closeDialog();
    this.player.frozen = false;
    this.cooldown = 0.3;
  }

  examine(f) {
    const flags = WorldMemory.run.flags;
    if (f.kind === 'sign') return this.say(signText(f.sign, (k) => k === HOME || Boolean(flags[`visited.${k}`])));
    if (f.kind === 'bell') return this.ring(f);
    if (f.kind === 'boat') return this.through(f.to, 'n'); // 배를 타고 바다로 (북쪽 끝에서 출발)
    if (f.kind === 'side') WorldMemory.setFlag(`found.side.${this.area.key}`);
    return this.say(fillText(f.text, { loads: WorldMemory.world.loads }));
  }

  // 종 걸린 절벽: 열세 번 (밤에, 빈자리를 다 찾은 사람만)
  ring(f) {
    const r = ringBell(this.rings, { hour: new Date().getHours(), foundAll: Boolean(WorldMemory.run.flags['found.all']) });
    this.rings = r.rings;
    this.cooldown = 0.35;
    this.cameras.main.shake(140, 0.003);
    this.ui.bubbles.show(this.player, `댕— (${r.rings})`, '#ffffff', 900);
    if (r.opens) {
      this.leaving = true;
      this.ui.bubbles.narrate(this.player, '열셋. 종소리가 하늘에 부딪혀 돌아오지 않았다. 발밑이 보랏빛으로 젖는다.', 3200);
      this.cameras.main.flash(900, 190, 160, 255);
      this.time.delayedCall(2400, () => { this.leaving = false; this.through(f.to); });
      return;
    }
    if (r.rings >= 13) {
      this.rings = 0;
      this.ui.bubbles.narrate(this.player, r.night ? '열셋. …아무 일도 일어나지 않았다. 아직 뭔가 잊고 있다.' : '열셋. 한낮의 종소리는 금방 흩어졌다.', 2600);
    }
  }

  // 층 사이 문
  through(to, entry = 'portal') {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.time.delayedCall(480, () => this.scene.restart({ layer: to.layer, at: to.at, entry, back: this.back }));
  }

  go(exit) {
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(380, () => {
      if (exit.to === HOME && this.back) {
        // 시작 마을로: 이야기 필드로 돌아간다 (들어오는 쪽 = 이 출구의 반대편)
        this.scene.start('Field', { chapter: this.back.chapter, phase: this.back.phase, entry: OPPOSITE[exit.dir] });
        return;
      }
      // 바다에서 뭍(항구)에 닿으면 배에서 내려 배 옆에 선다
      const landing = this.area.sea && biomeAt(exit.at[0], exit.at[1], 'autumn', this.layerId) !== 'sea';
      this.scene.restart({ layer: this.layerId, at: exit.at, entry: landing ? 'boat' : OPPOSITE[exit.dir], back: this.back });
    });
  }

  worldToScreen(x, y) {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }
}
