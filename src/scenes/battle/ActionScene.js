// 전투 장면: 탑뷰 액션. 이 게임의 모든 전투가 여기서 열린다(길 위의 무리, 마을 습격, 시험·결투, 보스).
// 규칙은 src/action/engine.js(순수), 여기선 그리고 입력만 받는다. 동료는 없다 — 주인공 혼자 싸운다.
//   방향키 이동 · 마우스 조준 + 클릭 기본 공격(3연타) · Q W E R 스킬 · Space 구르기 · 1~8 퀵슬롯
//   엔진은 1/60초 고정 걸음으로 돌리고, 그림은 두 걸음 사이를 이어 그린다(보간) — 화면 빠르기와 무관하게 부드럽고 같은 손맛
//   data: { enemies, seed, boss?, note?, winLine?, winFlag?, victim?, from: { layer, at, key, back, biome } | { field: true, biome } }
//   길 맵에서 열리면 끝나고 그 칸으로, 마을(이야기 필드)에서 열리면(FieldBattle) 잠재운 필드를 깨워 결과를 넘긴다.
// 지면: 되돌리기(로드 — 네다섯 번에 한 번 누군가 지워진다) 또는 물러나기.
import Phaser from 'phaser';
import { FONT, FONT_TALK } from '../../config/game.js';
import { createAction, bodyMods, PLAYER } from '../../action/engine.js';
import { EQUIPMENT, CONTROLS, ARENA, STATUS, CONSUMABLES, QUICK_DEFAULT, STARTER_KIT, EQUIP_DEFAULT } from '../../../content/action/action.js';
import { FOES } from '../../../content/action/foes.js';
import { ITEMS, RARITY } from '../../../content/items/items.js';
import { PARTY } from '../../../content/battles/units.js';
import { characters } from '../../../content/characters/index.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { Sound } from '../../core/audio/Sound.js';
import { beatKey, rollDrops } from '../../battle/encounters.js';
import { BOUNTY, COIN } from '../../../content/shop/shops.js';
import { earn } from '../../shop/shop.js';
import { act, freshLife, skinOf, battleStats } from '../../life/life.js';
import { freshFarm, applySkills } from '../../farm/farm.js';
import { equipSkin, bladeColor } from '../../art/equipLook.js';
import { worldDate, worldNow } from '../../core/util/worldTime.js';
import { BattleArena } from './BattleArena.js';
import { BattleHud } from './BattleHud.js';
import { BattleFx } from './BattleFx.js';
import { BattleAnim } from './BattleAnim.js';
import { RELICS, RELIC_DROP } from '../../../content/action/relics.js';
import { pickRelic } from '../../battle/encounters.js';
import { PlayLog } from '../../core/playtest/PlayLog.js';

export default class ActionScene extends Phaser.Scene {
  constructor() { super('Action'); }

  init(data) { this.data0 = data; this.leaving = false; this.pressed = {}; this.quickPressed = null; this.hitStop = 0; this.sprites = {}; this.acc = 0; }

  create() {
    const { width: W, height: H } = this.scale;
    const s = (this.s = W / 960);
    if (this.scene.isActive('UI')) this.scene.setVisible(false, 'UI');
    // 처음 싸우면 기본 소모품을 챙겨 준다 (한 번만)
    let farm = WorldMemory.run?.farm ?? freshFarm();
    if (WorldMemory.run && !WorldMemory.run.flags['kit.starter']) {
      const items = { ...farm.items };
      for (const [k, n] of Object.entries(STARTER_KIT)) items[k] = (items[k] ?? 0) + n;
      farm = { ...farm, items };
      WorldMemory.setFarm(farm);
      WorldMemory.setFlag('kit.starter');
    }
    this.quick = WorldMemory.run?.quick ?? QUICK_DEFAULT;
    const equip = { ...EQUIP_DEFAULT, ...(WorldMemory.run?.equip ?? {}) };
    // 주인공의 몸: 체형·마음가짐·피로·히든 스킬이 체력·힘·빠르기·돌진을 바꾼다
    const life = WorldMemory.run?.life ?? freshLife();
    const mods = bodyMods(applySkills(battleStats(PARTY.me, life), WorldMemory.run?.farm?.skills ?? []));
    this.engine = createAction({ enemies: this.data0.enemies ?? ['slime'], equip, bag: farm.items, quick: this.quick, seed: (this.data0.seed ?? 1) * 7 + 3, mods, relics: WorldMemory.run?.relics ?? {} });
    const st = this.engine.state;
    this.bossId = (this.data0.enemies ?? []).find((id) => FOES[id]?.boss) ?? null;
    if (!this.data0.seedRetry) PlayLog.log('battle', { foes: this.data0.enemies, boss: this.bossId ?? undefined });

    // 싸움터: 화면에 맞춰
    // 카메라: 싸움터를 조금 크게(1.15배) 그리고 주인공 쪽(+ 노리는 쪽 조금)을 부드럽게 따라간다. 화면 위아래의 창을 가리지 않는 띠 안에서
    const Z0 = Math.min((W - 40 * s) / ARENA.w, (H - 130 * s) / ARENA.h);
    const Z = (this.Z = Z0 * 1.15);
    this.view = { top: 38 * s, bottom: H - 86 * s };
    this.ox = (W - ARENA.w * Z) / 2;
    this.oy = this.view.top;
    this.world = this.add.container(this.ox, this.oy).setScale(Z);
    this.follow(1, true);
    const biome = this.data0.boss && this.bossId === 'sweeper' ? 'shadow' : this.data0.from?.biome ?? 'temperate';
    this.arena = new BattleArena(this, this.world, biome, (this.data0.seed ?? 1) * 13 + 5);
    this.fx = new BattleFx(this, this.world, { biome, s, toScreen: (x, y) => ({ x: this.ox + x * this.Z, y: this.oy + y * this.Z }) });

    this.tellG = this.add.graphics();
    this.fxG = this.add.graphics();
    this.shotG = this.add.graphics();
    this.barG = this.add.graphics();
    this.world.add([this.tellG, this.fxG]);

    // 주인공
    this.skin = equipSkin(this, skinOf(WorldMemory.run?.life), equip);
    this.blade = Number.parseInt(bladeColor(equip), 16);
    const ck = `char.${this.skin}`;
    this.pShadow = this.add.ellipse(st.p.x, st.p.y + 6, 12, 4, 0x000000, 0.35);
    this.player = this.add.sprite(st.p.x, st.p.y, this.textures.exists(ck) ? ck : '__DEFAULT').setOrigin(0.5, 0.75);
    this.guardG = this.add.graphics();
    this.world.add([this.pShadow, this.player, this.guardG, this.shotG, this.barG]);
    this.anim = new BattleAnim(this, { player: this.player, blade: this.blade, bladeG: this.guardG, fx: this.fx });
    for (const f of st.foes) this.addFoe(f);
    this.arena.raise();
    this.dir = 'down';

    this.hud = new BattleHud(this, { bossId: this.bossId, skin: this.skin });
    this.hud.refresh(st, 0, true);
    this.bindInput();

    Sound.music(this, this.bossId ? 'boss' : 'battle', { fade: 200 });
    this.intro();
  }

  // 적 그림: 팩의 몬스터 그림(색을 입힌 갈래 포함) 또는 인물 도트
  addFoe(f) {
    const d = f.def;
    let spr;
    if (d.art.char) {
      const key = `char.${d.art.char}`;
      spr = this.add.sprite(f.x, f.y, this.textures.exists(key) ? key : '__DEFAULT', 0).setOrigin(0.5, 0.75).setScale((d.scale ?? 1) * 1.15);
    } else {
      const key = `mon.${d.art.mon}`;
      spr = this.add.sprite(f.x, f.y, this.textures.exists(key) ? key : '__DEFAULT', 0).setOrigin(0.5, 0.7);
      if (this.anims.exists(key)) spr.play(key);
      const h = spr.height || 16;
      spr.setScale(d.art.mon === 'GiantSpirit' ? (d.radius * 2.6) / h : (d.scale ?? 1) * 1.4); // 팩 몬스터는 16px이라 조금 키워 그린다
    }
    if (d.tint) spr.setTint(d.tint);
    const shadow = this.add.ellipse(f.x, f.y + d.radius * 0.7, d.radius * 2, Math.max(3, d.radius * 0.6), 0x000000, 0.35);
    this.world.add([shadow, spr]);
    this.world.bringToTop(this.shotG); this.world.bringToTop(this.barG);
    this.arena?.raise();
    this.sprites[f.uid] = { spr, shadow, lx: f.x, ly: f.y, face: 'down', base: spr.scaleX, phase: (Object.keys(this.sprites).length * 1.7) % 6.28 };
  }

  bindInput() {
    const kb = this.input.keyboard;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT'); // 이동은 방향키 (Q W E R은 스킬)
    kb.on('keydown-SPACE', (e) => { if (!e.repeat) this.pressed.dodge = true; }); // 구르기
    this.input.on('pointerdown', (p) => { if (p.rightButtonDown()) this.pressed.dodge = true; }); // 오른쪽 클릭도 구르기
    for (const [slot, key] of Object.entries(CONTROLS.skills)) kb.on(`keydown-${key}`, (e) => { if (!e.repeat) this.pressed[slot] = true; });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'].forEach((name, i) => kb.on(`keydown-${name}`, () => { this.quickPressed = i; }));
    this.input.on('pointerdown', (p) => { if (p.leftButtonDown() || p.wasTouch) this.pressed.atk = true; });
    this.input.mouse?.disableContextMenu();
  }

  intro() {
    const { width: W, height: H } = this.scale;
    const s = this.s;
    this.paused = true;
    const victim = this.data0.victim ? characters[this.data0.victim]?.name : null;
    const head = victim ? `…되돌렸다. ${victim}의 얼굴이 잘 떠오르지 않는다.` : this.data0.note ?? (this.bossId ? FOES[this.bossId].name : '덤벼든다');
    const band = this.add.graphics().setDepth(50);
    band.fillStyle(0x0b0810, 0.78).fillRect(0, H / 2 - 45 * s, W, 90 * s);
    band.fillStyle(victim ? 0xff7a6a : 0xe8b860, 0.9).fillRect(0, H / 2 - 45 * s, W, 2 * s).fillRect(0, H / 2 + 43 * s, W, 2 * s);
    const t1 = this.add.text(W / 2, H / 2 - 14 * s, head, { fontFamily: FONT_TALK, fontSize: `${(head.length > 24 ? 16 : 24) * s}px`, color: victim ? '#ff9a8a' : '#f4f0e8', align: 'center', wordWrap: { width: W * 0.8 } }).setOrigin(0.5).setDepth(51);
    const t2 = this.add.text(W / 2, H / 2 + 22 * s, `방향키 이동 · 클릭 공격 · Space 구르기 · ${Object.values(CONTROLS.skills).join(' ')} 스킬 · 1~8 퀵슬롯`, { fontFamily: FONT, fontSize: `${11 * s}px`, color: '#d8d0c0' }).setOrigin(0.5).setDepth(51);
    Sound.sfx(this, 'tell', { volume: 0.4 });
    this.time.delayedCall(victim || this.data0.note ? 1900 : 1100, () => {
      this.tweens.add({ targets: [band, t1, t2], alpha: 0, duration: 300, onComplete: () => [band, t1, t2].forEach((o) => o.destroy()) });
      this.paused = false;
    });
  }

  toWorld(px, py) { return { x: (px - this.ox) / this.Z, y: (py - this.oy) / this.Z }; }

  readInput() {
    const k = this.keys;
    const x = (k.RIGHT.isDown ? 1 : 0) - (k.LEFT.isDown ? 1 : 0);
    const y = (k.DOWN.isDown ? 1 : 0) - (k.UP.isDown ? 1 : 0);
    const ptr = this.input.activePointer;
    const aim = this.toWorld(ptr.x, ptr.y);
    const input = { move: { x, y }, aim, ...this.pressed, quick: this.quickPressed };
    if (ptr.isDown && ptr.leftButtonDown?.()) { input.atk = true; input.held = true; } // 누르고 있으면 계속 벤다
    this.pressed = {};
    this.quickPressed = null;
    return input;
  }

  // 고정 걸음: 엔진은 늘 1/60초씩. 남은 시간(acc)으로 두 걸음 사이를 이어 그린다
  update(_, dms) {
    if (this.leaving || !this.engine) return;
    const dt = Math.min(dms / 1000, 0.1);
    const STEP = 1 / 60;
    if (!this.paused && !this.engine.over) {
      if (this.hitStop > 0) this.hitStop -= dt; // 타격 멈춤: 시간이 잠깐 선다
      else {
        this.acc += dt;
        let input = this.readInput();
        let n = 0;
        while (this.acc >= STEP && n < 6 && !this.engine.over) {
          this.snap();
          this.handle(this.engine.step(STEP, input));
          // 이번 프레임에 '누른' 것은 첫 걸음에만 (누르고 있는 이동·공격은 계속)
          input = { move: input.move, aim: input.aim, atk: input.held };
          this.acc -= STEP; n += 1;
          if (this.hitStop > 0) { this.acc = 0; break; }
        }
        if (n >= 6) this.acc = 0;
      }
    }
    this.alpha = this.paused || this.engine.over || this.hitStop > 0 ? 1 : Math.min(1, this.acc / STEP);
    this.follow(dt);
    this.draw(dt);
    this.hud.refresh(this.engine.state, dt);
  }

  // 카메라 따라가기: 그릇(싸움터)을 옮긴다. 싸움터 밖은 둘레 숲까지(24칸)만 보이게 막는다
  follow(dt, snap = false) {
    const st = this.engine?.state;
    if (!st) return;
    const { width: W } = this.scale, Z = this.Z, M = 24;
    const p = this.at(st.p);
    const ptr = this.input.activePointer;
    const aim = this.toWorld(ptr.x, ptr.y);
    const moved = ptr.x || ptr.y; // 마우스를 움직이기 전엔 앞쪽 보기 없이
    const ax = moved ? Phaser.Math.Clamp(aim.x - p.x, -80, 80) * 0.18 : 0, ay = moved ? Phaser.Math.Clamp(aim.y - p.y, -80, 80) * 0.18 : 0;
    const vw = W, vh = this.view.bottom - this.view.top;
    const fit = (want, size, span, lo) => (span * Z + 2 * M * Z <= size ? lo + (size - span * Z) / 2 : Phaser.Math.Clamp(want, lo + size - (span + M) * Z, lo + M * Z));
    const tx = fit(W / 2 - (p.x + ax) * Z, vw, ARENA.w, 0);
    const ty = fit(this.view.top + vh / 2 - (p.y + ay) * Z, vh, ARENA.h, this.view.top);
    const k = snap ? 1 : 1 - Math.exp(-6 * dt);
    this.ox += (tx - this.ox) * k; this.oy += (ty - this.oy) * k;
    this.world.setPosition(Math.round(this.ox), Math.round(this.oy));
  }

  // 걸음 전 자리를 적어 둔다(보간용)
  snap() {
    const st = this.engine.state;
    st.p.px = st.p.x; st.p.py = st.p.y;
    for (const f of st.foes) { f.px = f.x; f.py = f.y; }
    for (const sh of st.shots) { sh.px = sh.x; sh.py = sh.y; }
  }

  // 그릴 자리: 앞 걸음과 이번 걸음 사이
  at(o) {
    const a = this.alpha ?? 1;
    if (o.px === undefined) return { x: o.x, y: o.y };
    return { x: o.px + (o.x - o.px) * a, y: o.py + (o.y - o.py) * a };
  }

  foeOf(uid) { return this.engine.state.foes.find((f) => f.uid === uid); }

  handle(events) {
    const st = this.engine.state, fx = this.fx;
    for (const e of events) {
      if (e.type === 'skill') {
        fx.slash(e, { blade: this.blade, player: this.player });
        this.anim.onSkill(e);
        Sound.sfx(this, e.key === 'r' ? 'step' : e.key === 'e' ? 'cancel' : 'skill', { volume: 0.3, rate: e.key === 'atk' ? [1, 1.08, 0.85][e.combo] : 1 });
      }
      else if (e.type === 'dodge') { this.anim.onDodge(e); fx.dodge(e, this.player); Sound.sfx(this, 'step', { volume: 0.35, rate: 1.3 }); }
      else if (e.type === 'hurt' && e.to !== 'p') {
        const big = !e.dot && e.dmg >= 20;
        fx.num(e.x, e.y - 14, e.dmg, { color: e.dot ? '#ffb070' : big ? '#ffd75e' : '#ffffff', big });
        if (!e.dot) {
          const v = this.sprites[e.to];
          const third = e.skill === 'atk' && st.p.combo === 2;
          this.hitStop = big || third ? 0.07 : 0.04;
          if (third) this.cameras.main.shake(90, 0.004);
          fx.flash(v?.spr, this.foeOf(e.to)?.def.tint);
          this.anim.onFoeHurt(v);
          this.bossHit(v, this.foeOf(e.to));
          fx.spark(e.x, e.y - 6, Math.atan2(st.p.y - e.y, st.p.x - e.x), big);
          if (big) this.cameras.main.shake(70, 0.003);
          this.hud.hit();
          Sound.sfx(this, 'hit', { volume: 0.4, rate: 0.9 + Math.random() * 0.2 });
        }
      }
      else if (e.type === 'hurt' && e.to === 'p') { fx.num(e.x, e.y - 12, e.dmg, { color: '#ff6a6a', mine: true }); if (!e.dot) { this.cameras.main.shake(120, 0.005); fx.flash(this.player); this.anim.onHurt(e.dir !== undefined ? e.dir + Math.PI : Math.PI / 2); this.hitStop = Math.max(this.hitStop, 0.05); Sound.sfx(this, 'heavy', { volume: 0.45 }); } }
      else if (e.type === 'kill') this.killFx(e);
      else if (e.type === 'spawn') { this.addFoe(this.foeOf(e.uid)); const v = this.sprites[e.uid]; v.born = this.time.now; fx.appear(v.spr, e.x, e.y); }
      else if (e.type === 'tell' && e.boss) { Sound.sfx(this, 'tell', { volume: 0.3 }); this.hud.message(e.name, '#ff9a9a'); }
      else if (e.type === 'foeAttack') { this.anim.onFoeAttack(this.sprites[e.uid], e); if (e.boss && e.kind === 'sweep') this.cameras.main.shake(110, 0.004); }
      else if (e.type === 'block' || e.type === 'parry') { fx.text(e.x, e.y - 16, e.type === 'parry' ? '완벽한 막기!' : '막았다', '#9ad0ff', e.type === 'parry' ? 1.3 : 1); fx.spark(e.x, e.y - 4, st.p.face + Math.PI, e.type === 'parry'); Sound.sfx(this, 'cancel', { volume: 0.5 }); if (e.type === 'parry') { this.cameras.main.flash(80, 160, 200, 255); this.hitStop = 0.08; } }
      else if (e.type === 'reflect') fx.text(e.x, e.y, '반사', '#ffe066');
      else if (e.type === 'chain') { fx.bolt(e.x1, e.y1 - 6, e.x2, e.y2 - 6); Sound.sfx(this, 'cancel', { volume: 0.25, rate: 1.6 }); }
      else if (e.type === 'blast') { fx.blast(e.x, e.y, e.r); this.cameras.main.shake(90, 0.004); Sound.sfx(this, 'heavy', { volume: 0.35, rate: 1.3 }); }
      else if (e.type === 'regen' && (e.leech || e.soul)) fx.num(st.p.x, st.p.y - 14, `+${e.amount}`, { color: '#7affa0' });
      else if (e.type === 'charged') fx.text(st.p.x, st.p.y - 22, '기습!', '#c8b8ff');
      else if (e.type === 'calm') fx.text(st.p.x, st.p.y - 22, '고요한 일격', '#a0d8ff');
      else if (e.type === 'resist') fx.text(e.x, e.y - 20, '버텼다', '#9ad0ff');
      else if (e.type === 'status') { const d = STATUS[e.id]; const who = e.to === 'p' ? st.p : this.foeOf(e.to); if (who) fx.text(who.x, who.y - 22, d.name, d.color); }
      else if (e.type === 'heal') { fx.num(e.x, e.y - 12, `+${e.amount}`, { color: '#7affa0' }); fx.heal(e.x, e.y); Sound.sfx(this, 'heal', { volume: 0.4 }); }
      else if (e.type === 'quick') this.hud.message(`${CONSUMABLES[e.id].name} (남은 ${e.left})`, RARITY[CONSUMABLES[e.id].rarity].glow);
      else if (e.type === 'quickFail') this.hud.message(e.why, '#ff9a9a');
      else if (e.type === 'regenCut') this.hud.message('맞아서 회복이 끊겼다', '#ffb0b0');
      else if (e.type === 'win' || e.type === 'lose') { if (e.type === 'lose') this.anim.onLose(); this.time.delayedCall(e.type === 'lose' ? 700 : 500, () => this.finish(e.type)); }
    }
  }

  // 큰 그림자(보스)는 맞으면 '맞음' 그림을 한 번 돌리고 다시 서 있는 그림으로
  bossHit(v, f) {
    if (!v || f?.def.art.mon !== 'GiantSpirit' || !this.anims.exists('mon.GiantSpiritHit')) return;
    if (v.spr.anims.currentAnim?.key === 'mon.GiantSpiritHit' && v.spr.anims.isPlaying) return;
    v.spr.play('mon.GiantSpiritHit');
    v.spr.once('animationcomplete', () => { if (v.spr.active) v.spr.play('mon.GiantSpirit'); });
  }

  // 쓰러짐: 하얗게 번쩍이며 납작해지고, 그 색의 조각이 튄다. 보스는 크게, 느리게
  killFx(e) {
    const v = this.sprites[e.uid];
    if (!v) return;
    const f = FOES[e.id];
    Sound.sfx(this, 'hit', { volume: 0.5, rate: 0.6 });
    this.fx.burst(e.x, e.y, f?.tint ?? 0xffffff, f?.boss ? 2.2 : (f?.scale ?? 1));
    this.fx.vanish(v.spr, v.shadow);
    if (f?.boss) { this.cameras.main.shake(300, 0.008); this.cameras.main.flash(200, 255, 240, 220); this.time.timeScale = 0.4; this.time.delayedCall(240, () => { this.time.timeScale = 1; }); }
    delete this.sprites[e.uid];
  }

  // 적 그림을 제 색으로 (예고 번쩍임을 걷는다)
  baseTint(spr, f) { spr.setTintMode(Phaser.TintModes.MULTIPLY); if (f.def.tint) spr.setTint(f.def.tint); else spr.clearTint(); }

  dirOf(a) { return Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up'); }

  draw(dt = 0) {
    const st = this.engine.state, p = st.p;
    // 주인공: 이동하면 걷기, 조준 쪽을 본다. 몸짓(베기·찌르기·구르기…)은 BattleAnim이 자세 그림과 칼을 그린다
    const a = p.face;
    const pp = this.at(p);
    const walkOk = this.anim.drawPlayer(p, pp, this.paused ? 0 : dt, this.time.now);
    const key = `char.${this.skin}.${this.dirOf(a)}`;
    if (walkOk && this.anims.exists(key)) {
      if (p.moving) { if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key); } else { this.player.anims.stop(); this.player.setFrame(this.anims.get(key).frames[0].frame.name); }
    }
    // 맞은 직후엔 깜빡인다
    const blink = p.hurtT > 0 && Math.floor(this.time.now / 50) % 2 === 0;
    this.player.setAlpha(blink ? 0.25 : p.dash?.dodge ? 0.8 : 1);
    this.pShadow.setPosition(pp.x, pp.y + 4).setScale(p.dash?.dodge ? 0.8 : 1, 1);
    if (p.moving && !this.paused) this.fx.step(pp.x, pp.y, dt); // 발밑 먼지
    // 적: 위치, 인물 도트는 움직이는 쪽을 본다, 작은 체력 막대
    const bg = this.barG.clear();
    for (const f of st.foes) {
      const v = this.sprites[f.uid];
      if (!v || f.hp <= 0) continue;
      const fp = this.at(f);
      // 예고 중: 터지기 직전엔 붉게 번쩍인다(무엇이 칠지 몸으로도 보인다). 몸짓은 BattleAnim
      const tell = f.state === 'tell' && !f.charge ? st.tells.find((t) => t.uid === f.uid) : null;
      if (tell) {
        const k = 1 - tell.left / tell.total;
        if (k > 0.75 && Math.floor(this.time.now / 45) % 2 === 0) v.spr.setTint(0xff5060).setTintMode(Phaser.TintModes.FILL); else this.baseTint(v.spr, f);
      } else if (v.tinted) this.baseTint(v.spr, f);
      v.tinted = Boolean(tell);
      // 움직였나: 마지막 엔진 걸음의 변화로 본다(화면이 엔진보다 빨라도 걷기/서기가 깜빡이지 않게)
      const bx = f.px ?? v.lx, by = f.py ?? v.ly;
      const mv = Math.hypot(f.x - bx, f.y - by) > 0.02;
      this.anim.drawFoe(v, f, fp, tell, Math.atan2(p.y - f.y, p.x - f.x), mv ? Math.atan2(f.y - by, f.x - bx) : null, this.paused ? 0 : dt, this.time.now);
      const born = Math.min(1, (this.time.now - (v.born ?? -1e9)) / 300); // 막 나타난 적은 서서히
      v.spr.setAlpha(born * (f.status.stun ? 0.75 : 1));
      v.lx = f.x; v.ly = f.y;
      if (!f.def.boss && f.hp < f.maxHp) {
        const w = 14, y = fp.y - f.def.radius - 10;
        bg.fillStyle(0x000000, 0.6).fillRect(fp.x - w / 2 - 0.5, y - 0.5, w + 1, 3);
        bg.fillStyle(0xe05a4a, 1).fillRect(fp.x - w / 2, y, w * (f.hp / f.maxHp), 2);
      }
    }
    if (p.guard > 0) {
      const half = (st.skills.e.arc * Math.PI) / 360;
      this.guardG.lineStyle(2, st.skills.e.blocksShots ? 0xffe066 : 0x9ad0ff, 0.9).beginPath().arc(pp.x, pp.y, 11, p.face - half, p.face + half).strokePath();
    }
    // 예고: 붉은 바닥, 시간이 갈수록 차오르고 테두리가 빨리 뛴다. 터지기 직전엔 하얗게
    const g = this.tellG; g.clear();
    const now = this.time.now;
    for (const t of st.tells) {
      const k = 1 - Math.max(0, (t.left ?? t.total) / t.total);
      const pulse = 0.55 + 0.45 * Math.sin(now / (k > 0.7 ? 40 : 90));
      const edge = k > 0.85 ? 0xffffff : 0xff6070;
      g.fillStyle(0xff3040, 0.12).lineStyle(1.2, edge, 0.5 + 0.45 * pulse);
      if (t.kind === 'sweep') {
        const half = (t.arc * Math.PI) / 360;
        g.slice(t.x, t.y, t.range, t.dir - half, t.dir + half).fillPath();
        g.fillStyle(0xff3040, 0.28 + 0.12 * k).slice(t.x, t.y, t.range * k, t.dir - half, t.dir + half).fillPath();
        g.beginPath().arc(t.x, t.y, t.range, t.dir - half, t.dir + half).strokePath();
        g.lineBetween(t.x, t.y, t.x + Math.cos(t.dir - half) * t.range, t.y + Math.sin(t.dir - half) * t.range);
        g.lineBetween(t.x, t.y, t.x + Math.cos(t.dir + half) * t.range, t.y + Math.sin(t.dir + half) * t.range);
      } else if (t.kind === 'lunge') {
        const L = t.range, w = t.width, c = Math.cos(t.dir), sn = Math.sin(t.dir);
        const pts = (u1) => [[0, -w / 2], [u1, -w / 2], [u1, w / 2], [0, w / 2]].map(([u, vv]) => new Phaser.Math.Vector2(t.x + c * u - sn * vv, t.y + sn * u + c * vv));
        g.fillPoints(pts(L), true); g.strokePoints(pts(L), true, true);
        g.fillStyle(0xff3040, 0.28 + 0.12 * k).fillPoints(pts(L * k), true);
        // 화살촉 무늬
        for (let u = 12; u < L; u += 14) {
          const bx = t.x + c * u, by = t.y + sn * u;
          g.lineBetween(bx - c * 4 - sn * 4, by - sn * 4 + c * 4, bx, by);
          g.lineBetween(bx - c * 4 + sn * 4, by - sn * 4 - c * 4, bx, by);
        }
      } else if (t.kind === 'shot') {
        g.lineStyle(1, edge, 0.4 + 0.5 * k).lineBetween(t.x, t.y, t.x + Math.cos(t.dir) * 70, t.y + Math.sin(t.dir) * 70);
        g.fillStyle(0xff6070, 0.5 * k).fillCircle(t.x + Math.cos(t.dir) * 70, t.y + Math.sin(t.dir) * 70, 2);
      } else {
        g.strokeCircle(t.x, t.y, 14 + 24 * k);
        g.fillStyle(0xff3040, 0.14).fillCircle(t.x, t.y, 10 + 8 * k);
      }
    }
    // 탄: 날아온 쪽으로 꼬리, 빛 테두리
    const sg = this.shotG; sg.clear();
    for (const sh0 of st.shots) {
      const sp = this.at(sh0), sh = { ...sh0, x: sp.x, y: sp.y };
      const mine = sh.from === 'player';
      // 칼바람: 날아가는 쪽으로 휜 초승달 칼날 + 잔상 / 가시: 짧은 초록 바늘
      if (mine && sh.kind === 'wave') {
        const a = Math.atan2(sh.vy, sh.vx), R = sh.r * 1.6;
        for (let i = 2; i >= 0; i -= 1) {
          const bx = sh.x - Math.cos(a) * i * 3, by = sh.y - Math.sin(a) * i * 3;
          sg.lineStyle(i ? 1.5 : 2.5, i ? 0x9af0d0 : 0xffffff, i ? 0.35 - i * 0.1 : 0.95).beginPath().arc(bx - Math.cos(a) * R * 0.6, by - Math.sin(a) * R * 0.6, R, a - 1.1, a + 1.1).strokePath();
        }
        continue;
      }
      if (mine && sh.kind === 'thorn') {
        const a = Math.atan2(sh.vy, sh.vx);
        sg.lineStyle(2, 0x2a3a18, 1).lineBetween(sh.x - Math.cos(a) * 4, sh.y - Math.sin(a) * 4, sh.x + Math.cos(a) * 2, sh.y + Math.sin(a) * 2);
        sg.lineStyle(1, 0xc8e090, 1).lineBetween(sh.x - Math.cos(a) * 3, sh.y - Math.sin(a) * 3, sh.x + Math.cos(a) * 2, sh.y + Math.sin(a) * 2);
        continue;
      }
      const col = mine ? 0xffe066 : sh.home ? 0x8ad04a : 0xff9a8a;
      const v = Math.hypot(sh.vx, sh.vy) || 1, tx = -sh.vx / v, ty = -sh.vy / v;
      for (let i = 1; i <= 4; i += 1) sg.fillStyle(col, 0.22 - i * 0.04).fillCircle(sh.x + tx * i * 3, sh.y + ty * i * 3, sh.r * (1 - i * 0.15));
      sg.fillStyle(col, 0.35).fillCircle(sh.x, sh.y, sh.r + 2);
      sg.fillStyle(mine ? 0xfff2b0 : sh.home ? 0xc8ff90 : 0xffe0d8, 1).fillCircle(sh.x, sh.y, sh.r * 0.6);
    }
  }

  finish(result) {
    if (this.leaving || this.finished) return;
    this.finished = true;
    PlayLog.log('battle.end', { result });
    const st = this.engine.state;
    st.shots.length = 0; st.tells.length = 0; // 끝난 싸움에 떠 있는 탄·예고는 걷는다
    // 쓴 소모품은 가방에서 빠지고, 싸움의 대가로 칼로리와 피로
    if (WorldMemory.run) {
      const farm = WorldMemory.run.farm ?? freshFarm();
      WorldMemory.setFarm({ ...farm, items: { ...farm.items, ...st.bag } });
      WorldMemory.setLife(act(WorldMemory.run.life ?? freshLife(), 'battle', worldNow(WorldMemory.run)));
    }
    Sound.music(this, null, { fade: 300 });
    Sound.sfx(this, result === 'win' ? 'win' : 'lose');
    const { width: W, height: H } = this.scale;
    const s = this.s;
    const from = this.data0.from ?? {};
    if (result === 'win') {
      if (from.key) WorldMemory.setFlag(`beat.${beatKey(from.key, this.data0.boss, worldDate(WorldMemory.run))}`);
      if (this.data0.winFlag) WorldMemory.setFlag(this.data0.winFlag);
      this.hud.banner('이겼다', this.data0.winLine ?? (this.bossId === 'sweeper' ? '그림자가 먼지처럼 흩어졌다. 빗자루만 남았다.' : null));
      const n = this.loot() + this.bossLoot() + this.relicLoot() + this.bounty();
      this.time.delayedCall(1500 + n * 700, () => this.leave('win'));
      return;
    }
    this.hud.banner('쓰러졌다', null, '#ff7a6a');
    const opts = [
      { label: '되돌리기 (R)', act: () => this.retry() },
      { label: from.field ? '물러나기 — 놈들은 그대로 간다 (Esc)' : '물러나기 (Esc)', act: () => this.leave('lose') },
    ];
    this.choices = opts.map((o, i) => this.add.text(W / 2, H * 0.42 + i * 34 * s, o.label, { fontFamily: FONT_TALK, fontSize: `${15 * s}px`, color: i ? '#f4f0e8' : '#ff7a6a' })
      .setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0).setInteractive({ useHandCursor: true }).on('pointerdown', o.act));
    this.input.keyboard.once('keydown-R', () => this.retry());
    this.input.keyboard.once('keydown-ESC', () => this.leave('lose'));
  }

  // 싸움의 대가: 쓰러뜨린 무리가 지니던 동전 (보스는 따로). 되돌려 다시 싸운 판에도 받는다 — 세계가 그만큼 비었으니까
  bounty() {
    if (!WorldMemory.run) return 0;
    const n = (this.data0.enemies ?? []).length;
    const coins = (this.bossId ? BOUNTY.boss : 0) + Math.max(0, n - (this.bossId ? 1 : 0)) * BOUNTY.foe;
    if (!coins) return 0;
    WorldMemory.setShop(earn(WorldMemory.run.shop, coins));
    const { width: W, height: H } = this.scale;
    this.time.delayedCall(300, () => {
      const t = this.add.text(W / 2, H * 0.6 - 28 * this.s, `동전 +${coins}${COIN}`, { fontFamily: FONT, fontSize: `${14 * this.s}px`, color: '#ffd27a' }).setOrigin(0.5).setShadow(1, 1, '#000', 0).setAlpha(0).setDepth(60);
      this.tweens.add({ targets: t, alpha: 1, y: t.y - 8 * this.s, duration: 260 });
      Sound.sfx(this, 'pickup');
    });
    return 1;
  }

  // 무리가 떨군 것 (content/battles/encounters.js의 DROPS): 같은 씨앗이면 같은 결과. 주운 수를 돌려준다
  loot() {
    if (!WorldMemory.run) return 0;
    const owned = (id) => Boolean(WorldMemory.run.gear?.[id]);
    const drops = rollDrops(this.data0.enemies ?? [], (this.data0.seed ?? 1) + WorldMemory.world.loads, owned);
    if (!drops.length) return 0;
    const farm = WorldMemory.run.farm ?? freshFarm();
    const items = { ...farm.items };
    const gear = { ...(WorldMemory.run.gear ?? {}) };
    for (const d of drops) { if (EQUIPMENT[d.item]) gear[d.item] = (gear[d.item] ?? 0) + d.n; else items[d.item] = (items[d.item] ?? 0) + d.n; }
    WorldMemory.setFarm({ ...farm, items });
    WorldMemory.setGear(gear);
    const { width: W, height: H } = this.scale;
    drops.forEach((d, i) => this.time.delayedCall(500 + i * 700, () => {
      const it = ITEMS[d.item], r = RARITY[it?.rarity ?? 'common'];
      const t = this.add.text(W / 2, H * 0.6 + i * 24 * this.s, `${d.text}  — ${it?.name ?? d.item}${d.n > 1 ? ` ×${d.n}` : ''}`, { fontFamily: FONT, fontSize: `${13 * this.s}px`, color: r.glow }).setOrigin(0.5).setShadow(1, 1, '#000', 0).setAlpha(0).setDepth(60);
      this.tweens.add({ targets: t, alpha: 1, y: t.y - 8 * this.s, duration: 260 });
      Sound.sfx(this, 'pickup');
    }));
    return drops.length;
  }

  // 유물: 이긴 싸움마다 무리 수만큼 확률(최대 RELIC_DROP.max), 보스는 처음 이길 때 하나 확정. 같은 씨앗이면 같은 것
  relicLoot() {
    if (!WorldMemory.run) return 0;
    const n = (this.data0.enemies ?? []).length;
    const seed = (this.data0.seed ?? 1) * 31 + WorldMemory.world.loads * 7 + n;
    const bossFirst = this.bossId && !WorldMemory.run.flags[`relic.${this.bossId}`];
    const id = pickRelic({ seed, chance: bossFirst ? 1 : Math.min(RELIC_DROP.max, n * RELIC_DROP.perFoe), boss: bossFirst });
    if (!id) return 0;
    if (bossFirst) WorldMemory.setFlag(`relic.${this.bossId}`);
    WorldMemory.addRelic(id);
    const r = RELICS[id], col = RARITY[r.rarity].glow;
    const { width: W, height: H } = this.scale;
    this.time.delayedCall(700, () => {
      const y = H * 0.3;
      const glow = this.add.circle(W / 2, y, 30 * this.s, Number.parseInt(col.slice(1), 16), 0.25).setDepth(59);
      this.tweens.add({ targets: glow, scale: 1.6, alpha: 0, duration: 700, repeat: 1 });
      const icon = this.textures.exists(`icon.${id}`) ? this.add.image(W / 2, y, `icon.${id}`).setScale(0.5 * this.s).setDepth(60) : null;
      if (icon) this.tweens.add({ targets: icon, scale: 3.5 * this.s, duration: 300, ease: 'Back.out' });
      const t = this.add.text(W / 2, y + 36 * this.s, `유물 — ${r.name}`, { fontFamily: FONT_TALK, fontSize: `${17 * this.s}px`, color: col }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0);
      const d = this.add.text(W / 2, y + 58 * this.s, r.desc.split('.')[0] + '.', { fontFamily: FONT, fontSize: `${12 * this.s}px`, color: '#ffffff' }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0);
      [t, d].forEach((o) => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 260 }); });
      Sound.sfx(this, 'secret');
    });
    return 2;
  }

  // 보스를 처음 이기면 장비를 떨군다. 같은 칸이 비었거나 기본 장비면 바로 낀다
  bossLoot() {
    if (!WorldMemory.run || !this.bossId) return 0;
    const ids = FOES[this.bossId].drops ?? [];
    const flag = `loot.${this.bossId}`;
    if (!ids.length || WorldMemory.run.flags[flag]) return 0;
    WorldMemory.setFlag(flag);
    const equip = { ...EQUIP_DEFAULT, ...(WorldMemory.run.equip ?? {}) };
    const owned = { ...(WorldMemory.run.gear ?? {}) };
    const { width: W, height: H } = this.scale;
    ids.forEach((id, i) => {
      owned[id] = (owned[id] ?? 0) + 1;
      const it = EQUIPMENT[id];
      const slot = it.slot === 'accessory' ? 'acc1' : it.slot;
      if (!equip[slot] || equip[slot] === EQUIP_DEFAULT[slot]) equip[slot] = id;
      const r = RARITY[it.rarity];
      const t = this.add.text(W / 2, H * 0.42 + i * 42 * this.s, `획득 — ${it.name}`, { fontFamily: FONT_TALK, fontSize: `${18 * this.s}px`, color: r.glow }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0).setScale(0.5);
      this.add.text(W / 2, H * 0.42 + 20 * this.s + i * 42 * this.s, it.desc, { fontFamily: FONT, fontSize: `${12 * this.s}px`, color: '#ffffff' }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0);
      this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.out' });
      Sound.sfx(this, 'secret');
    });
    WorldMemory.setEquip(equip);
    WorldMemory.setGear(owned);
    return ids.length;
  }

  // 되돌리기 = 로드: 같은 싸움을 다른 씨앗으로 다시 (네다섯 번에 한 번 누군가 지워진다)
  retry() {
    if (this.leaving) return;
    this.leaving = true;
    PlayLog.log('battle.retry');
    const { victim } = WorldMemory.load();
    Sound.sfx(this, 'spirit', { detune: -1200 });
    this.cameras.main.flash(500, 230, 225, 240);
    this.time.delayedCall(550, () => this.scene.restart({ ...this.data0, seed: (this.data0.seed ?? 1) + WorldMemory.world.loads, victim, seedRetry: true }));
  }

  leave(result) {
    if (this.leaving) return;
    this.leaving = true;
    const from = this.data0.from ?? {};
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.setVisible(true, 'UI');
      // 마을에서 열린 싸움: 잠재워 둔 필드를 깨우고 결과를 넘긴다(습격은 그대로 이어진다)
      if (from.field) {
        this.scene.stop();
        this.scene.wake('Field', { battle: result });
        return;
      }
      this.scene.start('Area', { layer: from.layer, at: from.at, entry: 'center', back: from.back });
    });
  }
}

export { PLAYER };
