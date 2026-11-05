// 마을 밖 길 맵. 전체 지도(content/world/world.js)의 칸 하나를 걸어 다닌다.
// 이야기 컷신은 없고(아직), 기후·빛·떨어지는 것만 있다. 맵 끝 출구를 밟으면 이웃 칸으로.
// 시작 마을 칸으로 돌아가면 이야기 필드(Field)로 돌아간다.
import { GRADE_RARITY } from '../../../content/items/items.js';
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
import { Npc } from '../../field/Npc.js';
import { travelerAt, spiritHint, travelerLines } from '../../world/travelers.js';
import { encounterAt } from '../../battle/encounters.js';
import { trackWalk } from '../../life/track.js';
import { Sound } from '../../core/audio/Sound.js';
import { BIOME_MUSIC, BIOME_AMBIENT, HUB_MUSIC } from '../../../content/audio/audio.js';
import { FOES } from '../../../content/action/foes.js';
import { MONSTER_ART } from '../../../content/art/pack.js';
import { doFarm, actionFor, freshFarm, elfVillageGone, meetsElf } from '../../farm/farm.js';
import { FARM_TEXT, HIDDEN_SKILLS, ELF_LINES } from '../../../content/farm/farm.js';
import { maskNames, goneIds } from '../../core/script/speech.js';
import { characters } from '../../../content/characters/index.js';
import { Lighting } from '../../field/Lighting.js';
import { Ambient } from '../../field/Ambient.js';
import { softFlash } from '../../core/fx/softFlash.js';
import { fieldHubAt, visitPhase } from '../../world/visits.js';
import { passes } from '../../core/script/ScriptRunner.js';
import { resolveGoal, trackedStep } from '../../field/goals.js';
import { worldDate } from '../../core/util/worldTime.js';

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
    // 씬을 다시 쓸 때 이전 칸의 것이 남지 않게
    this.traveler = null;
    this.boat = null;
    this.monster = null;
    this.grace = 1.5; // 들어오자마자 부딪히지 않게
  }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui = this.scene.get('UI');
    WorldMemory.setWhere({ layer: this.layerId, at: this.at });
    const farm0 = WorldMemory.run.farm ?? freshFarm();
    const area = (this.area = buildArea(this.layerId, this.at, { season: season(worldDate(WorldMemory.run)), lowTide: lowTide(worldDate(WorldMemory.run)), felled: farm0.felled[cellKey(this.layerId, this.at)] ?? [], elfGone: elfVillageGone(farm0) }));
    this.key = area.key;

    this.map = new MapRenderer(this, area, { open: area.exits.map((e) => e.dir) });
    this.add.image(0, 0, this.map.renderGround('area.ground')).setOrigin(0).setDepth(-1000);
    // 벨 수 있는 나무·깰 수 있는 바위 (행동 파밍)
    this.farmables = this.map.placeObjects().filter((o) => actionFor(o.type)).map((o) => ({ ...o, action: actionFor(o.type), x: o.at[0] * 16 + o.w / 2, y: o.at[1] * 16 + o.h }));

    const [tx, ty] = area.entry(this.entryDir);
    this.player = new Player(this, tx, ty, FACE[this.entryDir] ?? 'down');
    // 바다에선 배를 타고 있다
    if (area.sea) this.boat = this.add.image(this.player.x, this.player.y, 'sheet.water', 'boat').setOrigin(0.5, 0.6);

    // 살펴볼 거리: 그림의 아래쪽 가운데가 서는 자리
    this.features = area.features.map((f) => {
      const [, , w, h] = OBJECTS[f.type].rect;
      return { ...f, x: f.at[0] * 16 + w / 2, y: f.at[1] * 16 + h };
    });

    // 떠돌이: 오늘 이 칸에 누가 있나 (같은 날 같은 칸이면 같은 사람)
    // 엘프 마을에선, 숲에서 한 그루도 안 벤 사람만 엘프를 만난다
    const who = area.id === 'elf' ? (meetsElf(farm0) ? 'elf' : null) : travelerAt(this.key, { kind: area.kind, biome: area.biome }, worldDate(WorldMemory.run));
    if (who) {
      const c = area.spots.center;
      this.traveler = new Npc(this, who, { at: [c.x + 2, c.y + 1], mode: 'wander', radius: 2, face: 'down' });
      this.lineIndex = 0;
      if (who === 'spirit') {
        this.traveler.sprite.setAlpha(0.6);
        this.tweens.add({ targets: this.traveler.sprite, alpha: { from: 0.35, to: 0.75 }, duration: 1600, yoyo: true, repeat: -1 });
      }
    }

    // 몬스터: 오늘 이 칸의 무리 (이긴 무리는 없다). 부딪히면 전투
    const flags0 = WorldMemory.run.flags;
    // (테스트용) dev.peace 플래그가 켜져 있으면 몬스터가 나오지 않는다
    this.encounter = flags0['dev.peace'] ? null : encounterAt(this.key, { kind: area.kind, biome: area.biome }, worldDate(WorldMemory.run), (k) => Boolean(flags0[`beat.${k}`]), (w) => passes(w, this.condCtx()));
    if (this.encounter) {
      const lead = FOES[this.encounter.enemies[0]];
      const c = area.spots.center;
      const mx = (c.x - 4) * 16, my = (c.y - 3) * 16;
      // 인물 도트를 쓰는 적(길 잃은 기사 등)은 그 인물 그림으로, 나머지는 팩의 몬스터 그림으로
      const key = lead.art.char ? `char.${lead.art.char}` : `mon.${lead.art.mon}`;
      const anim = lead.art.char ? `${key}.down` : key;
      this.monster = this.add.sprite(mx, my, key, 0).setOrigin(0.5, 0.9).setDepth(my);
      if (this.anims.exists(anim)) this.monster.play(anim);
      if (lead.tint) this.monster.setTint(lead.tint);
      if (lead.boss) this.monster.setScale(lead.art.char ? 1.2 : 1.4).setAlpha(0.85);
      this.tweens.add({ targets: this.monster, x: mx + 20, duration: 1800 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    // 지하와 은하는 늘 어둡다
    const time = this.layerId === 'surface' ? (this.back?.time ?? 'day') : 'night';
    const erased = WorldMemory.world.erased.length;
    this.lighting = new Lighting(this, { time, lights: [], erasedCount: erased, spots: area.spots, width: this.map.width, height: this.map.height });
    this.ambient = new Ambient(this, { time, map: area, erasedCount: erased, falling: FALLING[BIOMES[area.biome].falling] ?? null });

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, this.map.width, this.map.height).startFollow(this.player.sprite, true, 0.15, 0.15).setRoundPixels(true);
    cam.fadeIn(350, 0, 0, 0);

    // 소리: 거점 음악 > 기후 음악, 추운 곳은 바람·바다는 파도
    Sound.music(this, HUB_MUSIC[area.id] ?? BIOME_MUSIC[area.biome] ?? 'road');
    Sound.ambient(this, BIOME_AMBIENT[area.biome] ?? null);

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
    trackWalk(this, dt);
    if (this.traveler) {
      this.traveler.update(dt, { player: this.player, paused: this.ui.talking, blocked: (x, y) => this.area.isSolidPx(x, y) });
      this.traveler.sync();
    }
    if (this.boat) this.boat.setPosition(Math.round(this.player.x), Math.round(this.player.y + 2)).setDepth(this.player.y - 1);
    this.lighting.follow(this.player.x, this.player.y);
    this.lighting.update(dt);
    this.grace = Math.max(0, this.grace - dt);
    if (this.leaving || this.ui.talking || this.player.frozen) { this.ui.hud.showPrompt(null); return; }
    if (this.monster && this.grace <= 0 && Math.hypot(this.monster.x - this.player.x, this.monster.y - this.player.y) < 14) { this.fight(); return; }
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
    const t = this.traveler;
    if (t && Math.hypot(t.x - this.player.x, t.y - this.player.y) < bestD) best = { kind: 'traveler', x: t.x, y: t.y };
    if (!best) for (const o of this.farmables) {
      const d = Math.hypot(o.x - this.player.x, o.y - this.player.y);
      if (d < bestD) { best = { kind: 'farm', obj: o, x: o.x, y: o.y }; bestD = d; }
    }
    this.ui.hud.showPrompt(best ? this.worldToScreen(best.x, best.y - 22) : null);
    if (!best || this.cooldown > 0 || !this.player.justPressed('act')) return;
    if (best.kind === 'traveler') this.talkToTraveler();
    else if (best.kind === 'farm') this.farm(best.obj);
    else this.examine(best);
  }

  // 행동 파밍: 나무를 베거나 바위를 깬다. 벤 나무는 영영 사라진다
  farm(o) {
    this.cooldown = 0.6;
    const farm = WorldMemory.run.farm ?? freshFarm();
    const forest = this.area.biome === 'deepForest';
    const { farm: n, unlocked } = doFarm(farm, o.action, Math.random, o.action === 'chop' ? { key: this.key, at: o.at.join(','), forest } : null);
    WorldMemory.setFarm(n);
    Sound.sfx(this, o.action === 'chop' ? 'hit' : 'heavy', { rate: 0.8 + Math.random() * 0.3 });
    this.cameras.main.shake(90, 0.003);
    const item = { chop: 'wood', mine: 'stone' }[o.action];
    this.ui.bubbles.narrate(this.player, `${FARM_TEXT[o.action]} ([i=${item}] ${n.items[item]})`, 1600);
    if (o.action === 'chop') {
      // 나무가 쓰러진다: 그림을 치우고 충돌도 없앤다
      this.tweens.add({ targets: o.img, alpha: 0, angle: 8, duration: 350, onComplete: () => o.img.destroy() });
      const i = this.area.solids.findIndex((s2) => s2.x >= o.at[0] * 16 && s2.x < o.at[0] * 16 + o.w && s2.y >= o.at[1] * 16 && s2.y < o.at[1] * 16 + o.h);
      if (i >= 0) this.area.solids.splice(i, 1);
      this.farmables = this.farmables.filter((f) => f !== o);
      if (forest && n.forestChops === 1) this.time.delayedCall(1700, () => this.ui.bubbles.narrate(this.player, '숲이 조금 조용해졌다.', 2200));
    }
    if (unlocked) {
      const sk = HIDDEN_SKILLS[unlocked];
      this.time.delayedCall(800, () => {
        Sound.sfx(this, 'secret');
        softFlash(this, { ms: 600 });
        this.ui.bubbles.narrate(this.player, `히든 스킬 [q=${GRADE_RARITY[sk.grade]}]〔${sk.grade}〕 ${sk.name}[/q] — ${sk.desc}`, 4000);
      });
    }
  }

  // 떠돌이와 말: 말풍선으로 한 줄씩 (멈추지 않는다)
  talkToTraveler() {
    const t = this.traveler;
    t.faceToward(this.player.x, this.player.y);
    const erased = WorldMemory.world.erased;
    const lines = t.id === 'elf' ? ELF_LINES : travelerLines(t.id, { erasedAny: erased.length > 0 });
    let line = lines[this.lineIndex % lines.length];
    this.lineIndex += 1;
    const flags = WorldMemory.run.flags;
    if (line.includes('{hint}')) line = line.replace('{hint}', spiritHint(this.layerId, this.at, (k) => Boolean(flags[`visited.${k}`])).text);
    line = line.replace('{lastErased}', characters[erased.at(-1)?.id]?.name ?? '');
    // 정신체는 이 세계 바깥 사람이라 지워진 이름도 온전히 말한다
    if (t.id !== 'spirit') line = maskNames(line, t.id, goneIds(characters, { erased: erased.map((e) => e.id), phase: this.back?.phase }).map((id) => characters[id].name));
    WorldMemory.setFlag(`met.${t.id}`);
    Sound.sfx(this, t.id === 'spirit' ? 'spirit' : 'voice', { volume: t.id === 'spirit' ? 0.3 : 0.15 });
    this.ui.bubbles.show(t, line, characters[t.id].color, 3200);
    this.cooldown = 0.4;
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
    const r = ringBell(this.rings, { hour: worldDate(WorldMemory.run).getHours(), foundAll: Boolean(WorldMemory.run.flags['found.all']) });
    this.rings = r.rings;
    this.cooldown = 0.35;
    this.cameras.main.shake(140, 0.003);
    Sound.sfx(this, 'bell', { detune: -900 + r.rings * 40 });
    this.ui.bubbles.show(this.player, `댕— (${r.rings})`, '#ffffff', 900);
    if (r.opens) {
      this.leaving = true;
      this.ui.bubbles.narrate(this.player, '열셋. 종소리가 하늘에 부딪혀 돌아오지 않았다. 발밑이 보랏빛으로 젖는다.', 3200);
      softFlash(this, { color: 0xbea0ff, alpha: 0.3, ms: 1400 });
      Sound.sfx(this, 'secret');
      this.time.delayedCall(2400, () => { this.leaving = false; this.through(f.to); });
      return;
    }
    if (r.rings >= 13) {
      this.rings = 0;
      this.ui.bubbles.narrate(this.player, r.night ? '열셋. …아무 일도 일어나지 않았다. 아직 뭔가 잊고 있다.' : '열셋. 한낮의 종소리는 금방 흩어졌다.', 2600);
    }
  }

  // 몬스터와 부딪혔다 → 그 자리에서 싸움 (탑뷰 액션)
  fight() {
    this.leaving = true;
    this.ui.hud.showPrompt(null);
    softFlash(this, { alpha: 0.22, ms: 400 });
    this.cameras.main.shake(200, 0.006);
    Sound.sfx(this, 'heavy');
    this.time.delayedCall(300, () => this.scene.start('Action', {
      enemies: this.encounter.enemies, seed: this.encounter.seed, boss: this.encounter.boss, note: this.encounter.note,
      winFlag: this.encounter.flag,
      from: { layer: this.layerId, at: this.at, key: this.key, back: this.back, biome: this.area.biome },
    }));
  }

  // 층 사이 문
  through(to, entry = 'portal') {
    if (this.leaving) return;
    this.leaving = true;
    Sound.sfx(this, 'step');
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
      // 이야기가 있는 다른 마을(옆 마을 등): 그 마을의 필드로 들어간다
      const hub = this.back && fieldHubAt(exit.to);
      const ph = hub && visitPhase(hub, this.back.chapter, this.condCtx(), WorldMemory.run);
      if (ph) {
        this.scene.start('Field', { chapter: this.back.chapter, phase: ph, entry: OPPOSITE[exit.dir], back: this.back });
        return;
      }
      // 바다에서 뭍(항구)에 닿으면 배에서 내려 배 옆에 선다
      const landing = this.area.sea && biomeAt(exit.at[0], exit.at[1], 'autumn', this.layerId) !== 'sea';
      this.scene.restart({ layer: this.layerId, at: exit.at, entry: landing ? 'boat' : OPPOSITE[exit.dir], back: this.back });
    });
  }

  // 머리 위 이름(ui/NameTags): 길 위의 떠돌이
  nameTagsInfo(range) {
    const t = this.traveler;
    if (!t || !this.player || Math.hypot(t.x - this.player.x, t.y - this.player.y) > range) return [];
    return [{ x: t.x, y: t.y - 17, name: characters[t.id]?.name ?? '' }];
  }

  // 작은 지도(ui/Minimap)에 넘길 것: 이 칸의 맵, 나, 떠돌이(흰 점)와 몬스터(붉은 점)
  minimapInfo() {
    if (!this.player?.sprite?.active) return null;
    const people = [];
    if (this.traveler) people.push({ x: this.traveler.x / 16, y: this.traveler.y / 16 });
    if (this.monster?.active) people.push({ x: this.monster.x / 16, y: this.monster.y / 16, foe: true });
    const goal = this.layerId === 'surface' ? resolveGoal(trackedStep(WorldMemory.run.quests), { map: this.area, ctx: this.condCtx(), here: this.at, hubHere: null }) : null;
    return { key: this.key, map: this.area, name: this.area.name, player: { x: this.player.x / 16, y: this.player.y / 16 }, people, goal };
  }

  // 대본 조건(when)을 길 맵에서 볼 때 쓰는 최소한의 상태
  condCtx() {
    return {
      isErased: (id) => WorldMemory.isErased(id), erasedCount: () => WorldMemory.world.erased.length, loads: () => WorldMemory.world.loads,
      flag: (n) => WorldMemory.run.flags[n], minute: () => WorldMemory.run.time?.minute, day: () => WorldMemory.run.time?.day,
      quest: (id) => WorldMemory.quest(id),
      forestChops: () => WorldMemory.run.farm?.forestChops ?? 0,
    };
  }

  worldToScreen(x, y) {
    if (!this.cameras?.main) return { x: -9999, y: -9999 }; // 장면이 다시 시작되는 사이엔 카메라가 없다
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }
}
