// 전투 장면: 탑뷰 액션. 이 게임의 모든 전투가 여기서 열린다(길 위의 무리, 마을 습격, 시험·결투, 보스).
// 규칙은 src/action/engine.js(순수), 여기선 그리고 입력만 받는다. 동료는 없다 — 주인공 혼자 싸운다.
//   방향키 이동 · 마우스 조준 + 클릭 기본 공격 · Q W E R 스킬 · 1~8 퀵슬롯
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
import { PlayLog } from '../../core/playtest/PlayLog.js';

export default class ActionScene extends Phaser.Scene {
  constructor() { super('Action'); }

  init(data) { this.data0 = data; this.leaving = false; this.pressed = {}; this.quickPressed = null; this.hitStop = 0; this.sprites = {}; }

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
    this.engine = createAction({ enemies: this.data0.enemies ?? ['slime'], equip, bag: farm.items, quick: this.quick, seed: (this.data0.seed ?? 1) * 7 + 3, mods });
    const st = this.engine.state;
    this.bossId = (this.data0.enemies ?? []).find((id) => FOES[id]?.boss) ?? null;
    if (!this.data0.seedRetry) PlayLog.log('battle', { foes: this.data0.enemies, boss: this.bossId ?? undefined });

    // 싸움터: 화면에 맞춰
    const Z = (this.Z = Math.min((W - 40 * s) / ARENA.w, (H - 130 * s) / ARENA.h));
    this.ox = (W - ARENA.w * Z) / 2;
    this.oy = 46 * s;
    this.world = this.add.container(this.ox, this.oy).setScale(Z);
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
    this.sprites[f.uid] = { spr, shadow, lx: f.x, ly: f.y, face: 'down', base: spr.scaleX };
  }

  bindInput() {
    const kb = this.input.keyboard;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT'); // 이동은 방향키 (Q W E R은 스킬)
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
    const t2 = this.add.text(W / 2, H / 2 + 22 * s, `방향키 이동 · 클릭 공격 · ${Object.values(CONTROLS.skills).join(' ')} 스킬 · 1~8 퀵슬롯`, { fontFamily: FONT, fontSize: `${11 * s}px`, color: '#d8d0c0' }).setOrigin(0.5).setDepth(51);
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
    if (ptr.isDown && ptr.leftButtonDown?.()) input.atk = true; // 누르고 있으면 계속 벤다
    this.pressed = {};
    this.quickPressed = null;
    return input;
  }

  update(_, dms) {
    if (this.leaving || !this.engine) return;
    const dt = Math.min(dms / 1000, 0.05);
    if (!this.paused && !this.engine.over) {
      if (this.hitStop > 0) this.hitStop -= dt;
      else this.handle(this.engine.step(dt, this.readInput()));
    }
    this.draw(dt);
    this.hud.refresh(this.engine.state, dt);
  }

  foeOf(uid) { return this.engine.state.foes.find((f) => f.uid === uid); }

  handle(events) {
    const st = this.engine.state, fx = this.fx;
    for (const e of events) {
      if (e.type === 'skill') { fx.slash(e, { blade: this.blade, player: this.player }); Sound.sfx(this, e.key === 'r' ? 'step' : e.key === 'e' ? 'cancel' : 'skill', { volume: 0.3 }); }
      else if (e.type === 'hurt' && e.to !== 'p') {
        const big = !e.dot && e.dmg >= 20;
        fx.num(e.x, e.y - 14, e.dmg, { color: e.dot ? '#ffb070' : big ? '#ffd75e' : '#ffffff', big });
        if (!e.dot) {
          const v = this.sprites[e.to];
          this.hitStop = big ? 0.06 : 0.035;
          fx.flash(v?.spr, this.foeOf(e.to)?.def.tint);
          fx.squash(v?.spr);
          fx.spark(e.x, e.y - 6, Math.atan2(st.p.y - e.y, st.p.x - e.x), big);
          if (big) this.cameras.main.shake(70, 0.003);
          this.hud.hit();
          Sound.sfx(this, 'hit', { volume: 0.4, rate: 0.9 + Math.random() * 0.2 });
        }
      }
      else if (e.type === 'hurt' && e.to === 'p') { fx.num(e.x, e.y - 12, e.dmg, { color: '#ff6a6a', mine: true }); if (!e.dot) { this.cameras.main.shake(120, 0.005); fx.flash(this.player); Sound.sfx(this, 'heavy', { volume: 0.45 }); } }
      else if (e.type === 'kill') this.killFx(e);
      else if (e.type === 'spawn') { this.addFoe(this.foeOf(e.uid)); const v = this.sprites[e.uid]; fx.appear(v.spr, e.x, e.y); }
      else if (e.type === 'tell' && e.boss) { Sound.sfx(this, 'tell', { volume: 0.3 }); this.hud.message(e.name, '#ff9a9a'); }
      else if (e.type === 'foeAttack' && e.boss && e.kind === 'sweep') this.cameras.main.shake(110, 0.004);
      else if (e.type === 'block' || e.type === 'parry') { fx.text(e.x, e.y - 16, e.type === 'parry' ? '완벽한 막기!' : '막았다', '#9ad0ff', e.type === 'parry' ? 1.3 : 1); fx.spark(e.x, e.y - 4, st.p.face + Math.PI, e.type === 'parry'); Sound.sfx(this, 'cancel', { volume: 0.5 }); if (e.type === 'parry') { this.cameras.main.flash(80, 160, 200, 255); this.hitStop = 0.08; } }
      else if (e.type === 'reflect') fx.text(e.x, e.y, '반사', '#ffe066');
      else if (e.type === 'resist') fx.text(e.x, e.y - 20, '버텼다', '#9ad0ff');
      else if (e.type === 'status') { const d = STATUS[e.id]; const who = e.to === 'p' ? st.p : this.foeOf(e.to); if (who) fx.text(who.x, who.y - 22, d.name, d.color); }
      else if (e.type === 'heal') { fx.num(e.x, e.y - 12, `+${e.amount}`, { color: '#7affa0' }); fx.heal(e.x, e.y); Sound.sfx(this, 'heal', { volume: 0.4 }); }
      else if (e.type === 'quick') this.hud.message(`${CONSUMABLES[e.id].name} (남은 ${e.left})`, RARITY[CONSUMABLES[e.id].rarity].glow);
      else if (e.type === 'quickFail') this.hud.message(e.why, '#ff9a9a');
      else if (e.type === 'regenCut') this.hud.message('맞아서 회복이 끊겼다', '#ffb0b0');
      else if (e.type === 'win' || e.type === 'lose') this.time.delayedCall(500, () => this.finish(e.type));
    }
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

  dirOf(a) { return Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up'); }

  draw(dt = 0) {
    const st = this.engine.state, p = st.p;
    // 주인공: 이동하면 걷기, 조준 쪽을 본다
    const a = p.face;
    const key = `char.${this.skin}.${this.dirOf(a)}`;
    if (this.anims.exists(key)) {
      if (p.moving) { if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key); } else { this.player.anims.stop(); this.player.setFrame(this.anims.get(key).frames[0].frame.name); }
    }
    this.player.setPosition(p.x, p.y).setAlpha(p.invuln > 0 ? 0.5 : 1);
    this.pShadow.setPosition(p.x, p.y + 4);
    if (p.moving && !this.paused) this.fx.step(p.x, p.y, dt); // 발밑 먼지
    // 적: 위치, 인물 도트는 움직이는 쪽을 본다, 작은 체력 막대
    const bg = this.barG.clear();
    for (const f of st.foes) {
      const v = this.sprites[f.uid];
      if (!v || f.hp <= 0) continue;
      v.spr.setPosition(f.x, f.y).setAlpha(f.status.stun ? 0.7 : 1);
      v.shadow.setPosition(f.x, f.y + f.def.radius * 0.7);
      if (f.def.art.char) {
        const mv = Math.hypot(f.x - v.lx, f.y - v.ly) > 0.05;
        const dir = this.dirOf(mv ? Math.atan2(f.y - v.ly, f.x - v.lx) : Math.atan2(p.y - f.y, p.x - f.x));
        const k = `char.${f.def.art.char}.${dir}`;
        if (this.anims.exists(k)) { if (mv) { if (v.spr.anims.currentAnim?.key !== k || !v.spr.anims.isPlaying) v.spr.play(k); } else { v.spr.anims.stop(); v.spr.setFrame(this.anims.get(k).frames[0].frame.name); } }
      }
      v.lx = f.x; v.ly = f.y;
      if (!f.def.boss && f.hp < f.maxHp) {
        const w = 14, y = f.y - f.def.radius - 10;
        bg.fillStyle(0x000000, 0.6).fillRect(f.x - w / 2 - 0.5, y - 0.5, w + 1, 3);
        bg.fillStyle(0xe05a4a, 1).fillRect(f.x - w / 2, y, w * (f.hp / f.maxHp), 2);
      }
    }
    // 칼: 조준 방향으로 든다 (장비 색)
    this.guardG.clear();
    const hx = p.x + Math.cos(a) * 4, hy = p.y - 3 + Math.sin(a) * 4;
    this.guardG.lineStyle(2, 0x2a2533, 1).lineBetween(hx, hy, hx + Math.cos(a) * 10, hy + Math.sin(a) * 10);
    this.guardG.lineStyle(1, this.blade, 1).lineBetween(hx, hy, hx + Math.cos(a) * 10, hy + Math.sin(a) * 10);
    if (p.guard > 0) {
      const half = (st.skills.e.arc * Math.PI) / 360;
      this.guardG.lineStyle(2, st.skills.e.blocksShots ? 0xffe066 : 0x9ad0ff, 0.9).beginPath().arc(p.x, p.y, 11, p.face - half, p.face + half).strokePath();
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
    for (const sh of st.shots) {
      const mine = sh.from === 'player';
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
      const n = this.loot() + this.bossLoot() + this.bounty();
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
