// 탑다운 필드. 한 번에 한 페이즈(어디서·누가·무슨 일이)를 돌린다.
// 페이즈가 바뀌면 씬을 새 페이즈로 다시 시작하고, 시작점을 체크포인트로 저장한다.
// 전투는 별도 씬(사이드뷰, scenes/battle/)으로 넘어간다 — 다음 단계에서 구현.
import Phaser from 'phaser';
import { ZOOM, TALK_RANGE, BUBBLE_RANGE } from '../../config/game.js';
import { chapters } from '../../../content/chapters/index.js';
import { characters } from '../../../content/characters/index.js';
import * as village from '../../../content/maps/village.js';
import { TILE } from '../../../content/maps/village.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { passes } from '../../core/script/ScriptRunner.js';
import { maskNames, goneIds, lineSeconds, canHear } from '../../core/script/speech.js';
import { MapRenderer } from '../../field/MapRenderer.js';
import { Player } from '../../field/Player.js';
import { Npc } from '../../field/Npc.js';
import { Pickups } from '../../field/Pickups.js';
import { Lighting } from '../../field/Lighting.js';
import { EventDirector } from '../../field/EventDirector.js';
import { Cutscene } from '../../field/Cutscene.js';
import { Ambient } from '../../field/Ambient.js';
import { absence, objectiveText } from '../../field/absence.js';
import { OBJECTS } from '../../../content/art/pack.js';
import { LIFE_SPOTS, ACTIONS } from '../../../content/life/life.js';
import { act, canDo, minutesLeft, freshLife } from '../../life/life.js';
import { trackWalk } from '../../life/track.js';
import { countAction, freshFarm } from '../../farm/farm.js';
import { HIDDEN_SKILLS } from '../../../content/farm/farm.js';
import { Sound } from '../../core/audio/Sound.js';
import { Quests } from '../../field/systems/Quests.js';
import { Clues } from '../../field/systems/Clues.js';
import { Clock } from '../../field/systems/Clock.js';
import { Schedules } from '../../field/systems/Schedules.js';
import { Raids } from '../../field/systems/Raids.js';
import { PHASE_MUSIC } from '../../../content/audio/audio.js';
import { softFlash } from '../../core/fx/softFlash.js';

const px = (t) => t * TILE + TILE / 2;

export default class FieldScene extends Phaser.Scene {
  constructor() { super('Field'); }

  // entry: 마을 밖 길에서 돌아올 때 들어오는 쪽 ('n' 등). 없으면 페이즈의 시작 자리
  init({ chapter, phase, entry }) {
    this.entry = entry ?? null;
    this.chapterId = chapter;
    this.chapter = chapters[chapter];
    this.phaseId = phase ?? this.chapter.firstPhase;
    this.phase = this.chapter.phases[this.phaseId];
    this.elapsed = 0;
    this.leaving = false;
    this.flagTimes = {};
    this.cooldown = 0;
    WorldMemory.checkpoint(chapter, this.phaseId);
    if (WorldMemory.run.where) WorldMemory.setWhere(null); // 마을 안으로 돌아왔다
    this.clock = new Clock(this);
    this.clock.enterPhase(this.phase, !WorldMemory.run.flags[`entered.${chapter}.${this.phaseId}`]);
  }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui = this.scene.get('UI');

    // 맵
    this.openExits = this.phase.exits ?? [];
    this.map = new MapRenderer(this, village, { open: this.openExits });
    this.add.image(0, 0, this.map.renderGround()).setOrigin(0).setDepth(-1000);
    this.map.placeObjects();

    // 인물
    const p = this.phase.player;
    const at = this.entry ? village.entry(this.entry) : p.at;
    this.player = new Player(this, at[0], at[1], this.entry ? { n: 'down', s: 'up', w: 'right', e: 'left' }[this.entry] : p.face);
    this.npcs = {};
    this.props = [];
    for (const [id, cfg] of Object.entries(this.phase.npcs ?? {})) {
      if (cfg.when && !passes(cfg.when, this.ctx())) continue;
      if (WorldMemory.isErased(id)) this.placeRemnant(id, cfg.at);
      else this.npcs[id] = new Npc(this, id, cfg);
    }
    // 하루 일과를 따르는 사람들 (시계가 도는 날)
    this.schedules = new Schedules(this, village);
    this.schedules.place();
    // 생활 자리: 빵집 진열대·집·우물·허수아비에서 E (밤엔 잠만)
    this.lifeSpots = LIFE_SPOTS.filter((l) => !(l.needs && WorldMemory.isErased(l.needs)) && (!(this.clock.running ? this.clock.isNight : this.phase.time === 'night') || l.action === 'sleep'))
      .map((l) => ({ ...l, x: l.at[0] * TILE + TILE / 2, y: l.at[1] * TILE + TILE / 2 }));
    for (const prop of this.phase.props ?? []) {
      if (prop.when && !passes(prop.when, this.ctx())) continue;
      this.addProp(prop.prop, prop.at, prop.text);
    }

    this.pickups = new Pickups(this);
    this.lighting = new Lighting(this, {
      time: this.phase.time, lights: this.phase.lights, erasedCount: WorldMemory.world.erased.length,
      spots: village.spots, width: this.map.width, height: this.map.height, clock: this.clock.running,
    });
    this.lighting.setClock(this.clock.night);
    this.ambient = new Ambient(this, { time: this.phase.time, bonfire: this.phase.bonfire, map: village, erasedCount: WorldMemory.world.erased.length });

    // 카메라
    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, this.map.width, this.map.height).startFollow(this.player.sprite, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    cam.fadeIn(700, 0, 0, 0);

    // 이벤트와 컷신
    this.director = new EventDirector(this.phase.events ?? []);
    this.cutscene = new Cutscene(this, this.chapter.script, this.ctx());
    this.quests = new Quests(this);
    this.clues = new Clues(this);
    this.raids = new Raids(this, village);

    // UI 씬이 준비된 다음 프레임에 연결
    this.time.delayedCall(0, () => {
      this.ui.toScreen = (x, y) => this.worldToScreen(x, y);
      this.ui.hud.setPlace(this.phase.place);
      this.refreshObjective();
      this.ui.bubbles.clear();
      if (this.phase.onEnter && !WorldMemory.run.flags[`entered.${this.chapterId}.${this.phaseId}`]) {
        WorldMemory.setFlag(`entered.${this.chapterId}.${this.phaseId}`);
        this.cutscene.play(this.phase.onEnter);
      }
    });
    this.ambientTimer = 0;
    Sound.music(this, PHASE_MUSIC[this.phaseId] ?? null);
    Sound.ambient(this, null);
  }

  // 대본 조건 검사에 쓰는 문맥
  ctx() {
    return {
      isErased: (id) => WorldMemory.isErased(id),
      erasedCount: () => WorldMemory.world.erased.length,
      loads: () => WorldMemory.world.loads,
      flag: (n) => WorldMemory.run.flags[n],
      setFlag: (n) => { WorldMemory.setFlag(n); this.flagTimes[n] = this.elapsed; },
      addAffinity: (id, n) => WorldMemory.addAffinity(id, n),
      lastErasedName: () => characters[WorldMemory.world.erased.at(-1)?.id]?.name ?? '',
      minute: () => this.clock?.minute,
      day: () => this.clock?.day,
      quest: (id) => WorldMemory.quest(id),
    };
  }

  update(_, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const busy = this.cutscene.busy || this.ui.talking;
    this.elapsed += busy ? 0 : dt;
    this.cooldown = Math.max(0, this.cooldown - dt);

    const blocked = (x, y) => this.map.isSolidPx(x, y) || this.hitsNpc(x, y);
    this.player.update(dt, blocked);
    for (const npc of Object.values(this.npcs)) {
      // 걸으며 듣는 대사 중에는 마을도 계속 움직인다 (미아도 따라온다)
      npc.update(dt, { player: this.player, paused: busy && !this.cutscene.walking, blocked: (x, y) => this.map.isSolidPx(x, y) });
    }
    this.player.sync();
    trackWalk(this, dt);
    for (const npc of Object.values(this.npcs)) npc.sync();
    if (!busy) this.clock.update(dt);
    this.lighting.setClock(this.clock.night);
    this.ui.hud.setClock(this.clock.running ? this.clock.label : '');
    this.lighting.follow(this.player.x, this.player.y);
    this.lighting.update(dt);

    // 걸으며 듣는 대사 중에도 물건은 주울 수 있다
    if (!busy || this.cutscene.walking) for (const g of this.pickups.collect(this.player)) this.onPicked(g);
    // 퀘스트·단서는 걸으며 듣는 대사 중에도 따라잡는다(그동안에도 플레이어는 움직인다)
    if (!busy || this.cutscene.walking) { this.quests.update(dt); this.clues.update(dt); this.schedules.update(dt); }
    if (!busy) this.raids.update(dt);
    if (!busy) {
      const { runs, bubbles } = this.director.update(dt, this.world(), busy);
      bubbles.forEach((b) => this.bubble(b.who, b.text));
      for (const r of runs) { WorldMemory.setFlag(`done.${r.id}`); this.cutscene.play(r.run); }
      this.updateInteraction();
      this.updateAmbient(dt);
      this.checkExit();
    } else {
      this.ui.hud.showPrompt(null);
    }
  }

  // 이벤트 판정용 세계 상태
  world() {
    return {
      time: this.elapsed,
      player: { x: this.player.x, y: this.player.y, idleTime: this.player.idleTime },
      pos: (name) => {
        const n = this.npcs[name];
        if (n) return { x: n.x, y: n.y };
        const s = village.spots[name];
        return s ? { x: px(s.x), y: px(s.y) } : null;
      },
      inZone: (name) => {
        const z = village.zones[name];
        const tx = this.player.x / TILE, ty = this.player.y / TILE;
        return z && tx >= z.x && tx < z.x + z.w && ty >= z.y && ty < z.y + z.h;
      },
      pickedAll: (g) => this.pickups.allPicked(g),
      flag: (n) => WorldMemory.run.flags[n],
      // 이어하기로 들어와 이번 판에 기록이 없으면 페이즈 시작 시각으로 본다
      flagTime: (n) => this.flagTimes[n] ?? (WorldMemory.run.flags[n] ? 0 : undefined),
      passes: (when) => passes(when, this.ctx()),
    };
  }

  hitsNpc(x, y) {
    return Object.values(this.npcs).some((n) => n.mode !== 'follow' && Math.abs(n.x - x) < 6 && Math.abs(n.y - y) < 4);
  }

  // E: 가장 가까운 인물/물건에 말 걸기·살펴보기
  updateInteraction() {
    const target = this.nearestInteractable();
    this.ui.hud.showPrompt(target ? this.worldToScreen(target.x, target.y - 20) : null);
    // 습격 중이면 E는 먼저 곁의 몬스터에 맞서는 데 쓴다
    if (this.raids.active && this.cooldown <= 0 && this.player.justPressed('act')) { if (this.raids.onAct()) { this.cooldown = 0.25; return; } }
    if (!target || this.cooldown > 0 || !this.player.justPressed('act')) return;
    this.player.idleTime = 0;
    if (target.npc) this.talkTo(target.npc);
    else if (target.life) this.doLife(target.life);
    else this.examine(target);
  }

  nearestInteractable() {
    let best = null, bestD = TALK_RANGE;
    for (const npc of Object.values(this.npcs)) {
      const d = this.player.distTo(npc.x, npc.y);
      if (d < bestD) { best = { npc, x: npc.x, y: npc.y }; bestD = d; }
    }
    for (const l of this.lifeSpots ?? []) {
      const d = this.player.distTo(l.x, l.y);
      if (d < bestD) { best = { life: l, x: l.x, y: l.y }; bestD = d; }
    }
    for (const p of this.props) {
      if (!p.text) continue;
      const d = this.player.distTo(p.sprite.x, p.sprite.y);
      if (d < bestD) { best = { prop: p, x: p.sprite.x, y: p.sprite.y, text: p.text, remnantOf: p.remnantOf }; bestD = d; }
    }
    return best;
  }

  talkTo(npc) {
    npc.faceToward(this.player.x, this.player.y);
    if (this.quests.onTalk(npc.id)) return; // 퀘스트 단계의 대화, 또는 그 사람이 주는 퀘스트
    const label = `talk.${this.phaseId}.${npc.id}`;
    const seen = `talked.${this.chapterId}.${this.phaseId}.${npc.id}`;
    if (this.cutscene.has(label) && !WorldMemory.run.flags[seen]) {
      WorldMemory.setFlag(seen);
      this.cutscene.play(label);
      return;
    }
    const lines = characters[npc.id].bubbles?.[this.phaseId] ?? ['…'];
    this.bubble(npc.id, lines[Math.floor(Math.random() * lines.length)]);
  }

  async examine(target) {
    this.setFrozen(true);
    await this.ui.say('', '#cfc9dd', target.text);
    if (target.remnantOf && !WorldMemory.run.flags[`found.${target.remnantOf}`]) {
      // 빈자리를 찾았다: 이름은 나만 기억한다
      WorldMemory.setFlag(`found.${target.remnantOf}`);
      await this.ui.say('', '#cfc9dd', `여기는 ${characters[target.remnantOf].name}의 자리였다.`);
      const a = this.absence();
      if (a.all) WorldMemory.setFlag('found.all');
      this.refreshObjective();
    }
    this.ui.closeDialog();
    this.setFrozen(false);
  }

  // 생활 행동: 그 자리의 행동을 한다 (선택창 없음). 같은 행동은 쿨다운
  doLife(spot) {
    const life = WorldMemory.run.life ?? freshLife();
    const a = ACTIONS[spot.action];
    this.cooldown = 0.5;
    // 시계가 도는 날의 밤(20시~4시)에 잠자리에 들면 다음 날 아침 6시로
    if (spot.action === 'sleep' && this.clock.running && (this.clock.minute >= 20 * 60 || this.clock.minute < 4 * 60)) { this.sleep(); return; }
    if (!canDo(life, spot.action)) {
      this.ui.bubbles.narrate(this.player, `(${a.name}은 조금 이따가 — ${minutesLeft(life, spot.action)}분)`, 1800);
      return;
    }
    let n = act(life, spot.action);
    // 잠: 횟수가 쌓이면 '낮잠 고수', 있으면 피로가 더 풀린다
    if (spot.action === 'sleep') {
      const { farm, unlocked } = countAction(WorldMemory.run.farm ?? freshFarm(), 'sleep');
      WorldMemory.setFarm(farm);
      if (farm.skills.includes('napper')) n = { ...n, fatigue: Math.max(0, n.fatigue - 30) };
      if (unlocked) this.time.delayedCall(2700, () => this.ui.bubbles.narrate(this.player, `히든 스킬 [${HIDDEN_SKILLS[unlocked].grade}] ${HIDDEN_SKILLS[unlocked].name} — ${HIDDEN_SKILLS[unlocked].desc}`, 4000));
    }
    WorldMemory.setLife(n);
    Sound.sfx(this, spot.action === 'drill' || spot.action === 'water' ? 'hit' : 'heal', { volume: 0.25 });
    this.ui.bubbles.narrate(this.player, `${a.text}  (${n.weight.toFixed(1)}kg)`, 2600);
  }

  // 가까이 가면 가끔 혼잣말
  updateAmbient(dt) {
    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 5 + Math.random() * 4;
    const near = Object.values(this.npcs).filter((n) => n.distTo(this.player.x, this.player.y) < BUBBLE_RANGE && n.id !== 'mia');
    const n = near[Math.floor(Math.random() * near.length)];
    const lines = n && characters[n.id].bubbles?.[this.phaseId];
    if (lines?.length) this.bubble(n.id, lines[Math.floor(Math.random() * lines.length)]);
  }

  onPicked(group) {
    Sound.sfx(this, 'pickup');
    if (this.pickups.allPicked(group)) this.bubble('me', group === 'bread' ? '(다 주웠다)' : '(주웠다)');
  }

  // ── 컷신이 부르는 것들 ─────────────────────────
  setFrozen(v) {
    this.player.frozen = v;
    if (!v) this.cooldown = 0.25;
  }

  actorOf(id) { return id === 'me' ? this.player : this.npcs[id]; }

  bubble(who, text) {
    const a = this.actorOf(who);
    if (a) this.ui.bubbles.show(a, this.speech(who, text), characters[who]?.color);
  }

  // 마을 사람 입에서 지워진 이름은 깨진다. 내레이션과 주인공은 온전히 말한다
  speech(who, text) {
    const ids = goneIds(characters, { erased: WorldMemory.world.erased.map((e) => e.id), phase: this.phaseId });
    return maskNames(text, who, ids.map((id) => characters[id].name));
  }

  // 걸으며 듣는 대사 한 줄. 시간이 지나거나 진행 키를 누르면 넘어간다.
  // 화자에게서 멀면 '…'만 흐릿하게 보이고 그 장면은 놓친 것으로 남는다
  walkLine(who, text, label) {
    const ui = this.ui;
    let secs = lineSeconds(text);
    if (!who) {
      ui.bubbles.narrate(this.player, text, secs * 1000 + 400);
    } else {
      const a = this.actorOf(who);
      const heard = !a || who === 'me' || canHear(a.x - this.player.x, a.y - this.player.y, TILE);
      if (!heard) {
        WorldMemory.setFlag(`missed.${label}`);
        secs = 1.2;
      }
      if (a) ui.bubbles.show(a, heard ? text : '…', characters[who]?.color, secs * 1000 + 300, { faint: !heard });
      else ui.bubbles.narrate(this.player, `${characters[who]?.name ?? ''}: ${text}`, secs * 1000);
    }
    return new Promise((resolve) => {
      const start = this.time.now;
      let done = false;
      const finish = () => { if (done) return; done = true; ui.events.off('skip', onSkip); timer.remove(); resolve(); };
      // 말을 건 그 키 입력이 첫 줄을 바로 넘기지 않도록 잠깐 무시한다
      const onSkip = () => { if (this.time.now - start > 180) finish(); };
      const timer = this.time.delayedCall(secs * 1000, finish);
      ui.events.on('skip', onSkip);
    });
  }

  fx(kind) {
    const cam = this.cameras.main;
    const wait = (ms) => new Promise((r) => this.time.delayedCall(ms, r));
    if (kind === 'shake') { cam.shake(300, 0.006); return wait(320); }
    if (kind === 'bell') { cam.shake(260, 0.003); Sound.sfx(this, 'bell'); return wait(700); }
    if (kind === 'flash') return softFlash(this, { ms: 600 });
    if (kind === 'fade') { cam.fadeOut(900, 0, 0, 0); return wait(950); }
    if (kind === 'glitch') {
      Sound.sfx(this, 'spirit', { detune: -600 });
      // 화면이 한 번 살짝 흐려졌다 돌아온다(깜빡임 없이)
      cam.shake(160, 0.006);
      this.tweens.add({ targets: cam, alpha: 0.7, duration: 220, yoyo: true, ease: 'Sine.easeInOut' });
      return wait(500);
    }
    return wait(200);
  }

  async act(node) {
    switch (node.act) {
      case 'spawnPickups':
        this.pickups.spawn(node, (label) => label && this.cutscene.play(label));
        return;
      case 'spawnNpc': {
        if (this.npcs[node.id]) return;
        let at = node.at;
        if (node.near === 'player') {
          at = [Math.round(this.player.x / TILE - 0.5) + node.offset[0], Math.round(this.player.y / TILE - 0.5) + node.offset[1]];
        }
        const npc = new Npc(this, node.id, { at, mode: 'idle', face: 'down' });
        npc.faceToward(this.player.x, this.player.y);
        npc.sprite.setAlpha(0);
        this.tweens.add({ targets: npc.sprite, alpha: 1, duration: 400 });
        this.npcs[node.id] = npc;
        return;
      }
      case 'weatherLeak': {
        // 날씨 새어 듦(기획서 '시간'): 계절과 상관없이 잠깐 눈이나 비가 내리다 그친다
        const kind = node.kind ?? 'snow';
        const W = this.map.width, H = this.map.height;
        const zone = new Phaser.Geom.Rectangle(0, 0, W, H);
        const p = this.add.particles(0, 0, `fx.${kind}`, kind === 'rain'
          ? { frame: [0, 1, 2], emitZone: { type: 'random', source: zone }, lifespan: 500, speedY: { min: 140, max: 180 }, speedX: -20, alpha: { start: 0.7, end: 0 }, frequency: 12, quantity: 2 }
          : { frame: [0, 1, 2, 3, 4, 5, 6], emitZone: { type: 'random', source: zone }, lifespan: 6000, speedY: { min: 8, max: 18 }, speedX: { min: -6, max: 6 }, alpha: { start: 0.9, end: 0 }, frequency: 40 }).setDepth(9004);
        this.time.delayedCall((node.seconds ?? 40) * 1000, () => p.stop());
        this.time.delayedCall((node.seconds ?? 40) * 1000 + 7000, () => p.destroy());
        WorldMemory.setFlag('leak.seen');
        return;
      }
      case 'walkTo': {
        // 경유지(path)를 차례로 걸어가 그 자리에 머문다(walkAway와 달리 사라지지 않는다). wait면 도착까지 기다린다
        const npc = this.npcs[node.id];
        if (!npc) return;
        const go = async () => {
          for (const [x, y] of node.path ?? [node.to]) await npc.walkTo(x, y);
          npc.home = { x: npc.x, y: npc.y };
          if (node.mode) npc.mode = node.mode;
        };
        if (node.wait) await go(); else go();
        return;
      }
      case 'walkAway': {
        const npc = this.npcs[node.id];
        if (!npc) return;
        npc.walkTo(node.to[0], node.to[1]);
        this.tweens.add({ targets: npc.sprite, alpha: 0, delay: 900, duration: 700, onComplete: () => { npc.destroy(); delete this.npcs[node.id]; } });
        return;
      }
      case 'despawn': {
        const npc = this.npcs[node.id];
        if (!npc) return;
        await new Promise((r) => this.tweens.add({ targets: npc.sprite, alpha: 0, duration: 500, onComplete: r }));
        npc.destroy();
        delete this.npcs[node.id];
        return;
      }
      default:
        console.warn('알 수 없는 동작', node.act);
    }
  }

  placeRemnant(id, at) {
    const r = characters[id].remnant;
    if (r) { this.addProp(r.prop, at, r.text); this.props.at(-1).remnantOf = id; }
  }

  absence() {
    const ids = this.props.filter((p) => p.remnantOf).map((p) => p.remnantOf);
    return absence(WorldMemory.world.erased.map((e) => e.id), ids, WorldMemory.run.flags);
  }

  // 왼쪽 위 할 일: 진행 중인 퀘스트의 지금 단계가 있으면 그것, 없으면 그날의 목표
  refreshObjective() {
    // 습격 중이면 지킬 곳이 먼저다
    if (this.raids?.raid?.kind === 'raid' && !this.raids.busy) { this.ui.hud.setObjective(`${this.raids.raid.targetName}을(를) 지켜라`); return; }
    const step = this.quests?.tracked()?.step;
    this.ui.hud.setObjective(objectiveText(step ? step.text : this.phase.objective, this.absence()));
  }

  // 잠자리에 든다: 다음 날 아침 6시, 같은 하루(또는 phase.next)를 새로 시작한다
  sleep() {
    this.setFrozen(true);
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.time.delayedCall(950, () => {
      this.clock.sleepUntil('06:00');
      this.scene.restart({ chapter: this.chapterId, phase: this.phase.next ?? this.phaseId });
    });
  }

  // 대화창에 한 줄 말하고 닫는다(퀘스트 제안 등)
  async sayOnce(id, line) {
    const c = characters[id];
    this.setFrozen(true);
    await this.ui.say(c?.name ?? '', c?.color ?? '#cfc9dd', line, id);
    this.ui.closeDialog();
    this.setFrozen(false);
  }

  // prop: 코드로 그린 소품(prop.<이름>) 또는 팩 물체(OBJECTS의 이름)
  addProp(prop, at, text) {
    const def = OBJECTS[prop];
    const sprite = def
      ? this.add.image(px(at[0]), px(at[1]) + TILE / 2, `sheet.${def.sheet}`, prop).setOrigin(0.5, 1).setDepth(px(at[1]) + TILE / 2)
      : this.add.image(px(at[0]), px(at[1]), `prop.${prop}`).setDepth(px(at[1]) - 4);
    this.props.push({ sprite, text });
  }

  worldToScreen(x, y) {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }

  // 열린 출구의 맨 끝을 밟으면 마을 밖 길 맵으로
  checkExit() {
    if (this.leaving || !this.openExits.length) return;
    const ty = Math.floor(this.player.y / TILE);
    const e = village.exits.find((x) => this.openExits.includes(x.dir) && x.dir === 'n' && ty <= 1);
    if (!e) return;
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(380, () => this.scene.start('Area', {
      layer: 'surface', at: e.at, entry: { n: 's', s: 'n', e: 'w', w: 'e' }[e.dir],
      back: { chapter: this.chapterId, phase: this.phaseId, time: this.phase.time },
    }));
  }

  goPhase(phase) {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.restart({ chapter: this.chapterId, phase }));
  }

  endChapter(next) {
    if (next) {
      // 다음 이어하기 지점 (예: 프롤로그 끝 → 1장)
      WorldMemory.checkpoint(next.chapter, next.phase);
    }
    this.cameras.main.fadeOut(1400, 0, 0, 0);
    this.time.delayedCall(1500, () => {
      this.scene.stop('UI');
      this.scene.start('Title');
    });
  }
}
