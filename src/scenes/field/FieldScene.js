// 탑다운 필드. 한 번에 한 페이즈(어디서·누가·무슨 일이)를 돌린다.
// 페이즈가 바뀌면 씬을 새 페이즈로 다시 시작하고, 시작점을 체크포인트로 저장한다.
// 전투는 별도 씬(사이드뷰, scenes/battle/)으로 넘어간다 — 다음 단계에서 구현.
import Phaser from 'phaser';
import { ZOOM, TALK_RANGE, BUBBLE_RANGE } from '../../config/game.js';
import { chapters } from '../../../content/chapters/index.js';
import { characters } from '../../../content/characters/index.js';
import * as village from '../../../content/maps/village.js';
import { TILE } from '../../../content/art/tiles.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { passes } from '../../core/script/ScriptRunner.js';
import { MapRenderer } from '../../field/MapRenderer.js';
import { Player } from '../../field/Player.js';
import { Npc } from '../../field/Npc.js';
import { Pickups } from '../../field/Pickups.js';
import { Lighting } from '../../field/Lighting.js';
import { EventDirector } from '../../field/EventDirector.js';
import { Cutscene } from '../../field/Cutscene.js';
import { placeLandmarks } from '../../field/Landmarks.js';

const px = (t) => t * TILE + TILE / 2;

export default class FieldScene extends Phaser.Scene {
  constructor() { super('Field'); }

  init({ chapter, phase }) {
    this.chapterId = chapter;
    this.chapter = chapters[chapter];
    this.phaseId = phase ?? this.chapter.firstPhase;
    this.phase = this.chapter.phases[this.phaseId];
    this.elapsed = 0;
    this.flagTimes = {};
    this.cooldown = 0;
    WorldMemory.checkpoint(chapter, this.phaseId);
  }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui = this.scene.get('UI');

    // 맵
    this.map = new MapRenderer(this, village);
    this.add.image(0, 0, this.map.render()).setOrigin(0).setDepth(-1000);
    placeLandmarks(this, village.rows);

    // 인물
    const p = this.phase.player;
    this.player = new Player(this, p.at[0], p.at[1], p.face);
    this.npcs = {};
    this.props = [];
    for (const [id, cfg] of Object.entries(this.phase.npcs ?? {})) {
      if (cfg.when && !passes(cfg.when, this.ctx())) continue;
      if (WorldMemory.isErased(id)) this.placeRemnant(id, cfg.at);
      else this.npcs[id] = new Npc(this, id, cfg);
    }
    for (const prop of this.phase.props ?? []) {
      if (prop.when && !passes(prop.when, this.ctx())) continue;
      this.addProp(prop.prop, prop.at, prop.text);
    }

    this.pickups = new Pickups(this);
    this.lighting = new Lighting(this, {
      time: this.phase.time, lights: this.phase.lights, erasedCount: WorldMemory.world.erased.length,
      spots: village.spots, width: this.map.width, height: this.map.height,
    });

    // 카메라
    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, this.map.width, this.map.height).startFollow(this.player.sprite, true, 0.15, 0.15);
    cam.setRoundPixels(true);
    cam.fadeIn(700, 0, 0, 0);

    // 이벤트와 컷신
    this.director = new EventDirector(this.phase.events ?? []);
    this.cutscene = new Cutscene(this, this.chapter.script, this.ctx());

    // UI 씬이 준비된 다음 프레임에 연결
    this.time.delayedCall(0, () => {
      this.ui.toScreen = (x, y) => this.worldToScreen(x, y);
      this.ui.hud.setPlace(this.phase.place);
      this.ui.hud.setObjective(this.phase.objective);
      this.ui.bubbles.clear();
      if (this.phase.onEnter && !WorldMemory.run.flags[`entered.${this.chapterId}.${this.phaseId}`]) {
        WorldMemory.setFlag(`entered.${this.chapterId}.${this.phaseId}`);
        this.cutscene.play(this.phase.onEnter);
      }
    });
    this.ambientTimer = 0;
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
      npc.update(dt, { player: this.player, paused: busy, blocked: (x, y) => this.map.isSolidPx(x, y) });
    }
    this.lighting.follow(this.player.x, this.player.y);

    if (!busy) {
      for (const g of this.pickups.collect(this.player)) this.onPicked(g);
      const { runs, bubbles } = this.director.update(dt, this.world(), busy);
      bubbles.forEach((b) => this.bubble(b.who, b.text));
      for (const r of runs) { WorldMemory.setFlag(`done.${r.id}`); this.cutscene.play(r.run); }
      this.updateInteraction();
      this.updateAmbient(dt);
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
    if (!target || this.cooldown > 0 || !this.player.justPressed('act')) return;
    this.player.idleTime = 0;
    if (target.npc) this.talkTo(target.npc);
    else this.examine(target);
  }

  nearestInteractable() {
    let best = null, bestD = TALK_RANGE;
    for (const npc of Object.values(this.npcs)) {
      const d = this.player.distTo(npc.x, npc.y);
      if (d < bestD) { best = { npc, x: npc.x, y: npc.y }; bestD = d; }
    }
    for (const p of this.props) {
      if (!p.text) continue;
      const d = this.player.distTo(p.sprite.x, p.sprite.y);
      if (d < bestD) { best = { prop: p, x: p.sprite.x, y: p.sprite.y, text: p.text }; bestD = d; }
    }
    return best;
  }

  talkTo(npc) {
    npc.faceToward(this.player.x, this.player.y);
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
    this.ui.closeDialog();
    this.setFrozen(false);
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
    this.cameras.main.flash(80, 255, 240, 200);
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
    if (a) this.ui.bubbles.show(a, text, characters[who]?.color);
  }

  fx(kind) {
    const cam = this.cameras.main;
    const wait = (ms) => new Promise((r) => this.time.delayedCall(ms, r));
    if (kind === 'shake') { cam.shake(300, 0.006); return wait(320); }
    if (kind === 'bell') { cam.shake(260, 0.003); return wait(700); }
    if (kind === 'flash') { cam.flash(400, 255, 255, 255); return wait(400); }
    if (kind === 'fade') { cam.fadeOut(900, 0, 0, 0); return wait(950); }
    if (kind === 'glitch') {
      cam.shake(160, 0.02);
      this.tweens.add({ targets: cam, alpha: 0.3, duration: 50, yoyo: true, repeat: 4 });
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
    if (r) this.addProp(r.prop, at, r.text);
  }

  addProp(prop, at, text) {
    const sprite = this.add.image(px(at[0]), px(at[1]), `prop.${prop}`).setDepth(px(at[1]) - 4);
    this.props.push({ sprite, text });
  }

  worldToScreen(x, y) {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
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
