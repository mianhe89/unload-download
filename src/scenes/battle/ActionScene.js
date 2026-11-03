// 보스전 2단계: 탑뷰 액션. 규칙은 src/action/engine.js(순수), 여기선 그리고 입력만 받는다.
//   WASD 이동 · 마우스 조준 + 클릭 기본 공격 · Q W E R 스킬 · 1~8 퀵슬롯
// 1단계(턴제)에서 보스 체력이 일정 이하로 떨어지면 BattleScene이 이 장면을 연다.
import Phaser from 'phaser';
import { FONT, FONT_TALK } from '../../config/game.js';
import { createAction, PLAYER } from '../../action/engine.js';
import { EQUIPMENT, CONTROLS, ARENA, STATUS, CONSUMABLES, QUICK_DEFAULT, STARTER_KIT, EQUIP_DEFAULT, ACTION_BOSSES } from '../../../content/action/action.js';
import { RARITY } from '../../../content/items/items.js';
import { MONSTERS } from '../../../content/battles/units.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { Sound } from '../../core/audio/Sound.js';
import { beatKey } from '../../battle/encounters.js';
import { act, freshLife, skinOf } from '../../life/life.js';
import { freshFarm } from '../../farm/farm.js';
import { equipSkin, bladeColor } from '../../art/equipLook.js';

const KEYS = ['atk', 'q', 'w', 'e', 'r'];
const KEY_LABEL = { atk: '클릭', ...CONTROLS.skills };
const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);

export default class ActionScene extends Phaser.Scene {
  constructor() { super('Action'); }

  // data: BattleScene의 data0 + { hp, maxHp }
  init(data) { this.data0 = data; this.leaving = false; this.pressed = {}; this.quickPressed = null; this.hitStop = 0; }

  create() {
    const { width: W, height: H } = this.scale;
    const s = (this.s = W / 960);
    if (this.scene.isActive('UI')) this.scene.setVisible(false, 'UI');
    // 처음 들어오면 기본 소모품을 챙겨 준다 (한 번만)
    let farm = WorldMemory.run?.farm ?? freshFarm();
    if (WorldMemory.run && !WorldMemory.run.flags['kit.starter']) {
      const items = { ...farm.items };
      for (const [k, n] of Object.entries(STARTER_KIT)) items[k] = (items[k] ?? 0) + n;
      farm = { ...farm, items };
      WorldMemory.setFarm(farm);
      WorldMemory.setFlag('kit.starter');
    }
    this.quick = WorldMemory.run?.quick ?? QUICK_DEFAULT;
    const equip = WorldMemory.run?.equip ?? EQUIP_DEFAULT;
    const bossId = this.data0.bossId ?? 'sweeper';
    this.B = ACTION_BOSSES[bossId];
    this.engine = createAction({ boss: bossId, hp: this.data0.hp ?? PLAYER.maxHp, maxHp: this.data0.maxHp ?? PLAYER.maxHp, equip, bag: farm.items, quick: this.quick, seed: (this.data0.seed ?? 1) * 7 + 3 });
    const st = this.engine.state;

    // 경기장: 화면에 맞춰 정수배에 가깝게
    const Z = (this.Z = Math.min((W - 40 * s) / ARENA.w, (H - 120 * s) / ARENA.h));
    this.ox = (W - ARENA.w * Z) / 2;
    this.oy = 46 * s;
    this.world = this.add.container(this.ox, this.oy).setScale(Z);
    this.drawArena();

    this.tellG = this.add.graphics();
    this.fxG = this.add.graphics();
    this.shotG = this.add.graphics();
    this.world.add([this.tellG, this.fxG]);

    // 보스
    const art = MONSTERS[bossId]?.sprite;
    const bossTex = art && this.textures.exists(`mon.${art}`) ? `mon.${art}` : null;
    this.boss = bossTex ? this.add.sprite(st.b.x, st.b.y, bossTex).play(bossTex) : this.add.circle(st.b.x, st.b.y, this.B.radius, 0x2a1e3a);
    if (bossTex) this.boss.setScale((this.B.radius * 2.6) / this.boss.height).setTint(0xb8a8ff);
    this.bossShadow = this.add.ellipse(st.b.x, st.b.y + this.B.radius * 0.8, this.B.radius * 2, 7, 0x000000, 0.35);
    // 주인공
    this.skin = equipSkin(this, skinOf(WorldMemory.run?.life), equip);
    this.blade = Number.parseInt(bladeColor(equip), 16);
    const ck = `char.${this.skin}`;
    this.pShadow = this.add.ellipse(st.p.x, st.p.y + 6, 12, 4, 0x000000, 0.35);
    this.player = this.add.sprite(st.p.x, st.p.y, this.textures.exists(ck) ? ck : '__DEFAULT').setOrigin(0.5, 0.75);
    this.guardG = this.add.graphics();
    this.world.add([this.bossShadow, this.pShadow, this.boss, this.player, this.guardG, this.shotG]);
    this.dir = 'down';

    this.buildHud();
    this.bindInput();

    Sound.music(this, 'boss', { fade: 200 });
    this.intro();
  }

  drawArena() {
    const g = this.add.graphics();
    // 그림자 세계의 바닥: 어두운 보랏빛 돌, 가장자리는 지워진 듯 흐릿하게
    g.fillStyle(0x17121f, 1).fillRect(-6, -6, ARENA.w + 12, ARENA.h + 12);
    for (let y = 0; y < ARENA.h; y += 16) for (let x = 0; x < ARENA.w; x += 16) {
      const v = ((x * 7 + y * 13) % 5) / 5;
      g.fillStyle(Phaser.Display.Color.GetColor(38 + v * 10, 30 + v * 8, 52 + v * 12), 1).fillRect(x, y, 16, 16);
      g.fillStyle(0x000000, 0.18).fillRect(x, y + 15, 16, 1).fillRect(x + 15, y, 1, 16);
    }
    for (let i = 0; i < 6; i += 1) g.fillStyle(0x0b0810, 0.12 + i * 0.06).fillRect(-6 + i, -6 + i, ARENA.w + 12 - i * 2, 3).fillRect(-6 + i, ARENA.h + 3 - i, ARENA.w + 12 - i * 2, 3);
    g.lineStyle(2, 0x6a5a8a, 0.5).strokeRect(-1, -1, ARENA.w + 2, ARENA.h + 2);
    // 떠다니는 먼지
    for (let i = 0; i < 22; i += 1) {
      const d = this.add.rectangle(Math.random() * ARENA.w, Math.random() * ARENA.h, 1.5, 1.5, 0xcfc0ff, 0.5);
      this.tweens.add({ targets: d, y: d.y - 20 - Math.random() * 30, alpha: 0, duration: 3000 + Math.random() * 3000, repeat: -1, delay: Math.random() * 3000 });
      this.world?.add(d);
    }
    this.world.add(g);
    this.world.sendToBack(g);
  }

  buildHud() {
    const { width: W, height: H } = this.scale;
    const s = this.s;
    const T = (x, y, str, size, color, o = {}) => this.add.text(x, y, str, { fontFamily: o.font ?? FONT, fontStyle: o.bold ? 'bold' : '', fontSize: `${size * s}px`, color }).setShadow(1 * s, 1 * s, '#000', 0, false, true);
    // 보스 체력 (위)
    const bw = 520 * s;
    this.add.rectangle(W / 2, 22 * s, bw + 6 * s, 16 * s, 0x000000, 0.7).setStrokeStyle(2 * s, 0x6a5a8a);
    this.bossBarLag = this.add.rectangle(W / 2 - bw / 2, 22 * s, bw, 10 * s, 0xffffff, 0.8).setOrigin(0, 0.5);
    this.bossBar = this.add.rectangle(W / 2 - bw / 2, 22 * s, bw, 10 * s, 0xb04aff).setOrigin(0, 0.5);
    T(W / 2 - bw / 2, 4 * s, `${this.B.name}  —  2단계`, 11, '#e6d8ff', { bold: true });
    this.bossStatus = T(W / 2 + bw / 2, 4 * s, '', 11, '#ffb0b0').setOrigin(1, 0);
    // 내 체력 (아래 왼쪽)
    const by = H - 44 * s;
    T(16 * s, by - 30 * s, '나', 12, '#ffffff', { bold: true });
    this.add.rectangle(16 * s, by - 8 * s, 210 * s, 14 * s, 0x000000, 0.7).setOrigin(0, 0.5).setStrokeStyle(2 * s, 0x2a2533);
    this.hpLag = this.add.rectangle(18 * s, by - 8 * s, 206 * s, 9 * s, 0xffffff, 0.8).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(18 * s, by - 8 * s, 206 * s, 9 * s, 0x5ad06a).setOrigin(0, 0.5);
    this.regenBar = this.add.rectangle(18 * s, by - 3 * s, 0, 2 * s, 0x9affb0).setOrigin(0, 0.5);
    this.hpText = T(232 * s, by - 16 * s, '', 11, '#ffffff');
    this.statusText = T(16 * s, by + 4 * s, '', 11, '#ffffff');
    // 스킬 (아래 가운데)
    this.slots = KEYS.map((k, i) => {
      const x = W / 2 - 160 * s + i * 64 * s, y = H - 32 * s;
      const box = this.add.rectangle(x, y, 56 * s, 48 * s, 0x2a2438, 0.95).setStrokeStyle(2 * s, 0x6a5a8a);
      const cd = this.add.rectangle(x - 28 * s, y + 24 * s, 56 * s, 0, 0x000000, 0.7).setOrigin(0, 1);
      const key = T(x - 25 * s, y - 22 * s, KEY_LABEL[k], 9, '#ffd75e', { bold: true });
      const name = T(x, y + 4 * s, '', 11, '#ffffff').setOrigin(0.5);
      const sec = T(x, y + 4 * s, '', 13, '#ffffff', { bold: true }).setOrigin(0.5);
      return { k, box, cd, name, key, sec };
    });
    // 퀵슬롯 1~8 (아래 오른쪽)
    this.qslots = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const x = W - 16 * s - (7 - i) * 40 * s - 18 * s, y = H - 34 * s;
      const id = this.quick[i];
      const r = id ? RARITY[CONSUMABLES[id]?.rarity ?? 'common'] : null;
      const box = this.add.rectangle(x, y, 36 * s, 44 * s, 0x15111d, 0.92).setStrokeStyle(2 * s, r ? hex(r.glow) : 0x3a3448);
      const num = T(x - 15 * s, y - 21 * s, String(i + 1), 9, '#ffd75e', { bold: true });
      const name = T(x, y - 3 * s, id ? CONSUMABLES[id].name.slice(0, 2) : '', 10, r?.glow ?? '#fff').setOrigin(0.5);
      const cnt = T(x + 15 * s, y + 20 * s, '', 10, '#ffffff').setOrigin(1, 1);
      return { box, num, name, cnt, id };
    });
    this.msg = T(W / 2, H - 92 * s, '', 13, '#ffffff', { font: FONT_TALK }).setOrigin(0.5);
    this.refreshHud(true);
  }

  bindInput() {
    const kb = this.input.keyboard;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    // 스킬 4칸: 키는 content/action/action.js 의 CONTROLS
    for (const [slot, key] of Object.entries(CONTROLS.skills)) kb.on(`keydown-${key}`, (e) => { if (!e.repeat) this.pressed[slot] = true; });
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'].forEach((name, i) => kb.on(`keydown-${name}`, () => { this.quickPressed = i; }));
    this.input.on('pointerdown', (p) => { if (p.leftButtonDown() || p.wasTouch) this.pressed.atk = true; });
    this.input.mouse?.disableContextMenu();
  }

  intro() {
    const { width: W, height: H } = this.scale;
    const s = this.s;
    this.paused = true;
    const band = this.add.rectangle(W / 2, H / 2, W, 90 * s, 0x000000, 0.75).setDepth(50);
    const t1 = this.add.text(W / 2, H / 2 - 16 * s, '그림자가 일어선다', { fontFamily: FONT_TALK, fontSize: `${30 * s}px`, color: '#e6d8ff' }).setOrigin(0.5).setDepth(51);
    const t2 = this.add.text(W / 2, H / 2 + 20 * s, `WASD 이동 · 클릭 공격 · ${Object.values(CONTROLS.skills).join(' ')} 스킬 · 1~8 아이템 — 바닥의 붉은 예고를 피하라`, { fontFamily: FONT, fontSize: `${12 * s}px`, color: '#ffffff' }).setOrigin(0.5).setDepth(51);
    this.cameras.main.flash(400, 200, 160, 255);
    Sound.sfx(this, 'tell');
    this.time.delayedCall(1900, () => {
      this.tweens.add({ targets: [band, t1, t2], alpha: 0, duration: 300, onComplete: () => [band, t1, t2].forEach((o) => o.destroy()) });
      this.paused = false;
    });
  }

  toWorld(px, py) { return { x: (px - this.ox) / this.Z, y: (py - this.oy) / this.Z }; }

  readInput() {
    const k = this.keys;
    const x = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const y = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    const ptr = this.input.activePointer;
    const aim = this.toWorld(ptr.x, ptr.y);
    const input = { move: { x, y }, aim, ...this.pressed, quick: this.quickPressed };
    // 마우스를 누르고 있으면 계속 벤다
    if (ptr.isDown && ptr.leftButtonDown?.()) input.atk = true;
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
    this.refreshHud();
  }

  handle(events) {
    const st = this.engine.state;
    for (const e of events) {
      if (e.type === 'skill') { this.slashFx(e); Sound.sfx(this, e.key === 'r' ? 'wind' : e.key === 'e' ? 'cancel' : 'skill', { volume: 0.35 }); }
      else if (e.type === 'hurt' && e.to === 'b') { this.popNum(e.x, e.y - 14, e.dmg, e.dot ? '#ffb070' : '#ffffff', !e.dot && e.dmg >= 20); if (!e.dot) { this.hitStop = 0.045; this.flash(this.boss); Sound.sfx(this, 'hit', { volume: 0.45 }); } }
      else if (e.type === 'hurt' && e.to === 'p') { this.popNum(e.x, e.y - 12, e.dmg, '#ff6a6a'); if (!e.dot) { this.cameras.main.shake(140, 0.006); this.flash(this.player); Sound.sfx(this, 'heavy', { volume: 0.5 }); } }
      else if (e.type === 'tell') { Sound.sfx(this, 'tell', { volume: 0.35 }); this.message(e.name, '#ff9a9a'); }
      else if (e.type === 'bossAttack' && e.id === 'sweep') this.cameras.main.shake(120, 0.004);
      else if (e.type === 'block' || e.type === 'parry') { this.popText(e.x, e.y - 16, e.type === 'parry' ? '완벽한 막기!' : '막았다', '#9ad0ff'); Sound.sfx(this, 'cancel', { volume: 0.5 }); if (e.type === 'parry') this.cameras.main.flash(80, 160, 200, 255); }
      else if (e.type === 'reflect') this.popText(e.x, e.y, '반사', '#ffe066');
      else if (e.type === 'status') { const d = STATUS[e.id]; const who = e.to === 'p' ? st.p : st.b; this.popText(who.x, who.y - 22, d.name, d.color); }
      else if (e.type === 'heal') { this.popNum(e.x, e.y - 12, `+${e.amount}`, '#7affa0'); Sound.sfx(this, 'heal', { volume: 0.4 }); }
      else if (e.type === 'quick') this.message(`${CONSUMABLES[e.id].name} (남은 ${e.left})`, RARITY[CONSUMABLES[e.id].rarity].glow);
      else if (e.type === 'quickFail') this.message(e.why, '#ff9a9a');
      else if (e.type === 'regenCut') this.message('맞아서 회복이 끊겼다', '#ffb0b0');
      else if (e.type === 'win' || e.type === 'lose') this.time.delayedCall(500, () => this.finish(e.type));
    }
  }

  draw() {
    const st = this.engine.state, p = st.p, b = st.b;
    // 주인공: 이동 방향 → 걷기 애니메이션, 조준 방향 → 바라보는 쪽
    const a = p.face;
    const dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up');
    const key = `char.${this.skin}.${dir}`;
    if (this.anims.exists(key)) {
      if (p.moving) { if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key); } else { this.player.anims.stop(); this.player.setFrame(this.anims.get(key).frames[0].frame.name); }
    }
    this.player.setPosition(p.x, p.y).setAlpha(p.invuln > 0 ? 0.5 : 1);
    this.pShadow.setPosition(p.x, p.y + 4);
    this.boss.setPosition(b.x, b.y - 4);
    this.bossShadow.setPosition(b.x, b.y + this.B.radius * 0.7);
    this.boss.setAlpha(b.status.stun ? 0.7 : 1);
    // 칼: 조준 방향으로 든다 (장비 색)
    this.guardG.clear();
    const hx = p.x + Math.cos(a) * 4, hy = p.y - 3 + Math.sin(a) * 4;
    this.guardG.lineStyle(2, 0x2a2533, 1).lineBetween(hx, hy, hx + Math.cos(a) * 10, hy + Math.sin(a) * 10);
    this.guardG.lineStyle(1, this.blade, 1).lineBetween(hx, hy, hx + Math.cos(a) * 10, hy + Math.sin(a) * 10);
    // 막기
    if (p.guard > 0) {
      const half = (st.skills.e.arc * Math.PI) / 360;
      this.guardG.lineStyle(2, st.skills.e.blocksShots ? 0xffe066 : 0x9ad0ff, 0.9).beginPath().arc(p.x, p.y, 11, p.face - half, p.face + half).strokePath();
    }
    // 예고: 붉은 바닥, 시간이 갈수록 차오른다
    const g = this.tellG; g.clear();
    for (const t of st.tells) {
      const k = 1 - Math.max(0, (t.left ?? t.total) / t.total);
      g.fillStyle(0xff3040, 0.18).lineStyle(1, 0xff6070, 0.9);
      if (t.id === 'sweep') {
        const half = (t.arc * Math.PI) / 360;
        g.slice(t.x, t.y, t.range, t.dir - half, t.dir + half).fillPath();
        g.fillStyle(0xff3040, 0.35).slice(t.x, t.y, t.range * k, t.dir - half, t.dir + half).fillPath();
        g.beginPath().arc(t.x, t.y, t.range, t.dir - half, t.dir + half).strokePath();
      } else if (t.id === 'charge') {
        const L = t.range, w = t.width, c = Math.cos(t.dir), sn = Math.sin(t.dir);
        const pts = [[0, -w / 2], [L, -w / 2], [L, w / 2], [0, w / 2]].map(([u, v]) => new Phaser.Math.Vector2(t.x + c * u - sn * v, t.y + sn * u + c * v));
        g.fillPoints(pts, true); g.strokePoints(pts, true, true);
        const pk = [[0, -w / 2], [L * k, -w / 2], [L * k, w / 2], [0, w / 2]].map(([u, v]) => new Phaser.Math.Vector2(t.x + c * u - sn * v, t.y + sn * u + c * v));
        g.fillStyle(0xff3040, 0.35).fillPoints(pk, true);
      } else {
        g.strokeCircle(t.x, t.y, 20 + 30 * k);
        g.fillStyle(0xff3040, 0.15).fillCircle(t.x, t.y, 14 + 10 * k);
      }
    }
    // 탄
    const sg = this.shotG; sg.clear();
    for (const sh of st.shots) {
      const mine = sh.from === 'player';
      sg.fillStyle(mine ? 0xffe066 : sh.home ? 0x8ad04a : 0xb8a8ff, 0.3).fillCircle(sh.x, sh.y, sh.r + 2);
      sg.fillStyle(mine ? 0xfff2b0 : sh.home ? 0xc8ff90 : 0xe8e0ff, 1).fillCircle(sh.x, sh.y, sh.r * 0.6);
    }
  }

  slashFx(e) {
    const g = this.add.graphics();
    this.world.add(g);
    const st = this.engine.state;
    if (e.shape === 'arc') {
      const half = (e.arc * Math.PI) / 360;
      g.fillStyle(e.key === 'q' ? 0xffd75e : 0xffffff, 0.55).slice(e.x, e.y, e.range, e.face - half, e.face + half).fillPath();
      g.lineStyle(2, 0xffffff, 1).beginPath().arc(e.x, e.y, e.range, e.face - half, e.face + half).strokePath();
    } else if (e.shape === 'line') {
      const c = Math.cos(e.face), sn = Math.sin(e.face);
      g.lineStyle(e.width * 0.6, 0xffffff, 0.8).lineBetween(e.x, e.y, e.x + c * e.range, e.y + sn * e.range);
    } else if (e.shape === 'dash') {
      for (let i = 0; i < 4; i += 1) this.time.delayedCall(i * 40, () => {
        const ghost = this.add.sprite(st.p.x, st.p.y, this.player.texture.key, this.player.frame.name).setOrigin(0.5, 0.75).setAlpha(0.45).setTint(0x9ad0ff);
        this.world.add(ghost);
        this.tweens.add({ targets: ghost, alpha: 0, duration: 260, onComplete: () => ghost.destroy() });
      });
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
  }

  flash(spr) {
    if (!spr.setTint) return;
    spr.setTint(0xffffff).setTintMode?.(Phaser.TintModes.FILL);
    this.time.delayedCall(70, () => { spr.clearTint?.(); if (spr === this.boss && this.textures.exists(spr.texture.key)) spr.setTint(0xb8a8ff); });
  }

  popNum(x, y, n, color, big = false) { this.popText(x, y, String(n), color, big ? 1.5 : 1); }
  popText(x, y, str, color, k = 1) {
    const Z = this.Z;
    const t = this.add.text(this.ox + x * Z, this.oy + y * Z, str, { fontFamily: FONT, fontStyle: 'bold', fontSize: `${12 * this.s * k}px`, color }).setOrigin(0.5).setShadow(1, 1, '#000', 0, false, true).setDepth(40);
    t.setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: t.y - 24 * this.s, alpha: 0, delay: 350, duration: 500, onComplete: () => t.destroy() });
  }

  message(str, color = '#ffffff') {
    this.msg.setText(str).setColor(color).setAlpha(1);
    this.tweens.killTweensOf(this.msg);
    this.tweens.add({ targets: this.msg, alpha: 0, delay: 1200, duration: 400 });
  }

  refreshHud(first = false) {
    const st = this.engine.state, p = st.p, b = st.b, s = this.s;
    const bw = 520 * s;
    this.bossBar.width = bw * (b.hp / b.maxHp);
    this.bossBarLag.width += (this.bossBar.width - this.bossBarLag.width) * 0.08;
    this.bossStatus.setText(Object.keys(b.status).map((id) => STATUS[id].name).join(' '));
    this.hpBar.width = 206 * s * (p.hp / p.maxHp);
    this.hpBar.fillColor = p.hp / p.maxHp < 0.3 ? 0xe04a4a : p.status.poison ? 0x8ad04a : 0x5ad06a;
    this.hpLag.width += (this.hpBar.width - this.hpLag.width) * 0.08;
    this.regenBar.width = p.regen ? 206 * s * (p.regen.left / 8) : 0;
    this.hpText.setText(`${p.hp}/${p.maxHp}`);
    this.statusText.setText(Object.entries(p.status).map(([id, v]) => `${STATUS[id].name}${v.stack > 1 ? `×${v.stack}` : ''} ${v.left.toFixed(1)}`).join('  '));
    for (const sl of this.slots) {
      const sk = st.skills[sl.k];
      if (first) { sl.name.setText(sk.name).setColor(sk.changed ? '#ffbf47' : '#ffffff'); if (sk.changed) sl.box.setStrokeStyle(2 * s, 0xffbf47); }
      const left = p.cd[sl.k] ?? 0;
      sl.cd.setSize(56 * s, 48 * s * (left / sk.cd));
      sl.sec.setText(left > 0 ? left.toFixed(1) : '');
      sl.name.setAlpha(left > 0 ? 0.35 : 1);
    }
    for (const q of this.qslots) {
      if (!q.id) continue;
      const n = st.bag[q.id] ?? 0;
      q.cnt.setText(String(n));
      q.name.setAlpha(n > 0 ? 1 : 0.35);
    }
  }

  finish(result) {
    if (this.leaving) return;
    const st = this.engine.state;
    // 쓴 소모품은 가방에서 빠진다
    if (WorldMemory.run) {
      const farm = WorldMemory.run.farm ?? freshFarm();
      WorldMemory.setFarm({ ...farm, items: { ...farm.items, ...st.bag } });
      WorldMemory.setLife(act(WorldMemory.run.life ?? freshLife(), 'battle'));
    }
    Sound.music(this, null, { fade: 300 });
    Sound.sfx(this, result === 'win' ? 'win' : 'lose');
    const { width: W, height: H } = this.scale;
    const s = this.s;
    const from = this.data0.from;
    if (result === 'win') {
      if (from?.key) WorldMemory.setFlag(`beat.${beatKey(from.key, this.data0.boss)}`);
      this.message('그림자가 먼지처럼 흩어졌다. 빗자루만 남았다.', '#ffd27a');
      this.dropLoot();
      this.time.delayedCall(3200, () => this.leave());
      return;
    }
    this.message('쓰러졌다.', '#ff7a6a');
    const opts = [
      { label: '되돌리기 — 이 순간, 누군가 지워진다 (R)', act: () => this.retry() },
      { label: '물러나기 (Esc)', act: () => this.leave() },
    ];
    opts.forEach((o, i) => this.add.text(W / 2, H * 0.42 + i * 34 * s, o.label, { fontFamily: FONT_TALK, fontSize: `${15 * s}px`, color: i ? '#f4f0e8' : '#ff7a6a' })
      .setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0).setInteractive({ useHandCursor: true }).on('pointerdown', o.act));
    this.input.keyboard.once('keydown-R', () => this.retry());
    this.input.keyboard.once('keydown-ESC', () => this.leave());
  }

  // 처음 이기면 장비를 떨군다. 같은 칸이 기본 장비면 바로 낀다
  dropLoot() {
    if (!WorldMemory.run) return;
    const flag = `loot.${this.engine.state.b.id}`;
    if (WorldMemory.run.flags[flag]) return;
    WorldMemory.setFlag(flag);
    const equip = { ...EQUIP_DEFAULT, ...(WorldMemory.run.equip ?? {}) };
    const owned = { ...(WorldMemory.run.gear ?? {}) };
    const got = [];
    for (const id of this.B.drops ?? []) {
      owned[id] = (owned[id] ?? 0) + 1;
      const it = EQUIPMENT[id];
      if (!equip[it.slot] || equip[it.slot] === EQUIP_DEFAULT[it.slot]) equip[it.slot] = id;
      got.push(it);
    }
    WorldMemory.setEquip(equip);
    WorldMemory.setGear(owned);
    const { width: W, height: H } = this.scale;
    got.forEach((it, i) => {
      const r = RARITY[it.rarity];
      const t = this.add.text(W / 2, H * 0.4 + i * 30 * this.s, `획득 — ${it.name}`, { fontFamily: FONT_TALK, fontSize: `${18 * this.s}px`, color: r.glow }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0).setScale(0.5);
      this.add.text(W / 2, H * 0.4 + 22 * this.s + i * 30 * this.s, it.desc, { fontFamily: FONT, fontSize: `${12 * this.s}px`, color: '#ffffff' }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0);
      this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.out' });
      Sound.sfx(this, 'secret');
    });
  }

  // 되돌리기 = 로드: 보스전을 1단계부터 다시 (누군가 지워진다)
  retry() {
    if (this.leaving) return;
    this.leaving = true;
    const { victim } = WorldMemory.load();
    this.cameras.main.flash(500, 255, 255, 255);
    this.time.delayedCall(550, () => this.scene.start('Battle', { ...this.data0, seed: (this.data0.seed ?? 1) + WorldMemory.world.loads, victim }));
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    const from = this.data0.from;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.setVisible(true, 'UI');
      this.scene.start('Area', { layer: from.layer, at: from.at, entry: 'center', back: from.back });
    });
  }
}
