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

const KEYS = ['atk', 'q', 'w', 'e', 'r'];
const KEY_LABEL = { atk: '클릭', ...CONTROLS.skills };
const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);
// 싸움터 바닥: 그 땅의 색 [밝은, 어두운]
const FLOOR = {
  village: [0x5a7a3a, 0x4a6a30], temperate: [0x6a8a3e, 0x5a7a34], lateAutumn: [0x8a7a48, 0x7a6a3e], deepForest: [0x3a5a2e, 0x2e4a26],
  frost: [0x9aaab8, 0x8a9aa8], snow: [0xd8e0e8, 0xc8d0da], blackSnow: [0x4a4e5a, 0x3e424e], dry: [0x9a7a58, 0x8a6a4a], desert: [0xd8c08a, 0xc8b07a],
  coast: [0xd8c898, 0xc8b888], volcano: [0x7a3a24, 0x6a2e1e], cave: [0x4a3e44, 0x3e343a], deepCave: [0x3a3036, 0x30282e], lava: [0x6a2a1a, 0x5a2216],
  ancientHall: [0x8a7a5a, 0x7a6a4e], galaxy: [0x3a2e6a, 0x30265a], shadow: [0x2a2034, 0x221a2c],
};

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

    // 싸움터: 화면에 맞춰
    const Z = (this.Z = Math.min((W - 40 * s) / ARENA.w, (H - 130 * s) / ARENA.h));
    this.ox = (W - ARENA.w * Z) / 2;
    this.oy = 46 * s;
    this.world = this.add.container(this.ox, this.oy).setScale(Z);
    this.drawArena(this.data0.boss && this.bossId === 'sweeper' ? 'shadow' : this.data0.from?.biome ?? 'temperate');

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
    this.dir = 'down';

    this.buildHud();
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
    this.sprites[f.uid] = { spr, shadow, lx: f.x, ly: f.y, face: 'down' };
  }

  drawArena(biome) {
    const g = this.add.graphics();
    const [a, b] = FLOOR[biome] ?? FLOOR.temperate;
    g.fillStyle(0x0b0810, 1).fillRect(-6, -6, ARENA.w + 12, ARENA.h + 12);
    for (let y = 0; y < ARENA.h; y += 16) for (let x = 0; x < ARENA.w; x += 16) {
      g.fillStyle(((x * 7 + y * 13) % 5) < 3 ? a : b, 1).fillRect(x, y, 16, 16);
      if (((x * 3 + y * 5) % 7) === 0) g.fillStyle(0xffffff, 0.06).fillRect(x + 4, y + 6, 3, 2);
    }
    for (let i = 0; i < 6; i += 1) g.fillStyle(0x000000, 0.1 + i * 0.04).fillRect(-6 + i, -6 + i, ARENA.w + 12 - i * 2, 3).fillRect(-6 + i, ARENA.h + 3 - i, ARENA.w + 12 - i * 2, 3);
    g.lineStyle(2, 0x000000, 0.4).strokeRect(-1, -1, ARENA.w + 2, ARENA.h + 2);
    this.world.add(g);
    this.world.sendToBack(g);
  }

  buildHud() {
    const { width: W, height: H } = this.scale;
    const s = this.s;
    const T = (x, y, str, size, color, o = {}) => this.add.text(x, y, str, { fontFamily: o.font ?? FONT, fontStyle: o.bold ? 'bold' : '', fontSize: `${size * s}px`, color }).setShadow(1 * s, 1 * s, '#000', 0, false, true);
    // 위: 보스면 이름과 큰 체력 막대, 아니면 남은 무리
    const bw = 520 * s;
    if (this.bossId) {
      this.add.rectangle(W / 2, 22 * s, bw + 6 * s, 16 * s, 0x000000, 0.7).setStrokeStyle(2 * s, 0x6a5a8a);
      this.bossBarLag = this.add.rectangle(W / 2 - bw / 2, 22 * s, bw, 10 * s, 0xffffff, 0.8).setOrigin(0, 0.5);
      this.bossBar = this.add.rectangle(W / 2 - bw / 2, 22 * s, bw, 10 * s, 0xb04aff).setOrigin(0, 0.5);
      T(W / 2 - bw / 2, 4 * s, FOES[this.bossId].name, 11, '#e6d8ff', { bold: true });
      this.bossStatus = T(W / 2 + bw / 2, 4 * s, '', 11, '#ffb0b0').setOrigin(1, 0);
    }
    this.countText = T(W / 2, this.bossId ? 32 * s : 14 * s, '', 12, '#ffffff', { bold: true }).setOrigin(0.5, 0);
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
    // 퀵슬롯 1~8 (아래 오른쪽): 아이템 그림 + 개수
    this.qslots = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const x = W - 16 * s - (7 - i) * 40 * s - 18 * s, y = H - 34 * s;
      const id = this.quick[i];
      const r = id ? RARITY[CONSUMABLES[id]?.rarity ?? 'common'] : null;
      const box = this.add.rectangle(x, y, 36 * s, 44 * s, 0x15111d, 0.92).setStrokeStyle(2 * s, r ? hex(r.glow) : 0x3a3448);
      const num = T(x - 15 * s, y - 21 * s, String(i + 1), 9, '#ffd75e', { bold: true });
      const icon = id && this.textures.exists(`icon.${id}`) ? this.add.image(x, y - 2 * s, `icon.${id}`).setScale(1.6 * s) : null;
      const cnt = T(x + 15 * s, y + 20 * s, '', 10, '#ffffff').setOrigin(1, 1);
      return { box, num, icon, cnt, id };
    });
    this.msg = T(W / 2, H - 92 * s, '', 13, '#ffffff', { font: FONT_TALK }).setOrigin(0.5);
    this.refreshHud(true);
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
    const band = this.add.rectangle(W / 2, H / 2, W, 90 * s, 0x000000, 0.7).setDepth(50);
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
    this.draw();
    this.refreshHud();
  }

  foeOf(uid) { return this.engine.state.foes.find((f) => f.uid === uid); }

  handle(events) {
    const st = this.engine.state;
    for (const e of events) {
      if (e.type === 'skill') { this.slashFx(e); Sound.sfx(this, e.key === 'r' ? 'step' : e.key === 'e' ? 'cancel' : 'skill', { volume: 0.3 }); }
      else if (e.type === 'hurt' && e.to !== 'p') { this.popNum(e.x, e.y - 14, e.dmg, e.dot ? '#ffb070' : '#ffffff', !e.dot && e.dmg >= 20); if (!e.dot) { this.hitStop = 0.035; this.flash(this.sprites[e.to]?.spr, this.foeOf(e.to)?.def.tint); Sound.sfx(this, 'hit', { volume: 0.4, rate: 0.9 + Math.random() * 0.2 }); } }
      else if (e.type === 'hurt' && e.to === 'p') { this.popNum(e.x, e.y - 12, e.dmg, '#ff6a6a'); if (!e.dot) { this.cameras.main.shake(120, 0.005); this.flash(this.player); Sound.sfx(this, 'heavy', { volume: 0.45 }); } }
      else if (e.type === 'kill') this.killFx(e);
      else if (e.type === 'spawn') { this.addFoe(this.foeOf(e.uid)); const v = this.sprites[e.uid]; v.spr.setAlpha(0); this.tweens.add({ targets: v.spr, alpha: 1, duration: 300 }); }
      else if (e.type === 'tell' && e.boss) { Sound.sfx(this, 'tell', { volume: 0.3 }); this.message(e.name, '#ff9a9a'); }
      else if (e.type === 'foeAttack' && e.boss && e.kind === 'sweep') this.cameras.main.shake(110, 0.004);
      else if (e.type === 'block' || e.type === 'parry') { this.popText(e.x, e.y - 16, e.type === 'parry' ? '완벽한 막기!' : '막았다', '#9ad0ff'); Sound.sfx(this, 'cancel', { volume: 0.5 }); if (e.type === 'parry') this.cameras.main.flash(80, 160, 200, 255); }
      else if (e.type === 'reflect') this.popText(e.x, e.y, '반사', '#ffe066');
      else if (e.type === 'resist') this.popText(e.x, e.y - 20, '버텼다', '#9ad0ff');
      else if (e.type === 'status') { const d = STATUS[e.id]; const who = e.to === 'p' ? st.p : this.foeOf(e.to); if (who) this.popText(who.x, who.y - 22, d.name, d.color); }
      else if (e.type === 'heal') { this.popNum(e.x, e.y - 12, `+${e.amount}`, '#7affa0'); Sound.sfx(this, 'heal', { volume: 0.4 }); }
      else if (e.type === 'quick') this.message(`${CONSUMABLES[e.id].name} (남은 ${e.left})`, RARITY[CONSUMABLES[e.id].rarity].glow);
      else if (e.type === 'quickFail') this.message(e.why, '#ff9a9a');
      else if (e.type === 'regenCut') this.message('맞아서 회복이 끊겼다', '#ffb0b0');
      else if (e.type === 'win' || e.type === 'lose') this.time.delayedCall(500, () => this.finish(e.type));
    }
  }

  killFx(e) {
    const v = this.sprites[e.uid];
    if (!v) return;
    Sound.sfx(this, 'hit', { volume: 0.5, rate: 0.6 });
    for (let i = 0; i < 6; i += 1) {
      const d = this.add.rectangle(e.x, e.y - 4, 2, 2, 0xffffff, 0.9);
      this.world.add(d);
      const a = (i / 6) * Math.PI * 2;
      this.tweens.add({ targets: d, x: e.x + Math.cos(a) * 14, y: e.y - 4 + Math.sin(a) * 14, alpha: 0, duration: 380, onComplete: () => d.destroy() });
    }
    this.tweens.add({ targets: [v.spr, v.shadow], alpha: 0, duration: 260, onComplete: () => { v.spr.destroy(); v.shadow.destroy(); } });
    delete this.sprites[e.uid];
  }

  dirOf(a) { return Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up'); }

  draw() {
    const st = this.engine.state, p = st.p;
    // 주인공: 이동하면 걷기, 조준 쪽을 본다
    const a = p.face;
    const key = `char.${this.skin}.${this.dirOf(a)}`;
    if (this.anims.exists(key)) {
      if (p.moving) { if (this.player.anims.currentAnim?.key !== key || !this.player.anims.isPlaying) this.player.play(key); } else { this.player.anims.stop(); this.player.setFrame(this.anims.get(key).frames[0].frame.name); }
    }
    this.player.setPosition(p.x, p.y).setAlpha(p.invuln > 0 ? 0.5 : 1);
    this.pShadow.setPosition(p.x, p.y + 4);
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
    // 예고: 붉은 바닥, 시간이 갈수록 차오른다
    const g = this.tellG; g.clear();
    for (const t of st.tells) {
      const k = 1 - Math.max(0, (t.left ?? t.total) / t.total);
      g.fillStyle(0xff3040, 0.16).lineStyle(1, 0xff6070, 0.9);
      if (t.kind === 'sweep') {
        const half = (t.arc * Math.PI) / 360;
        g.slice(t.x, t.y, t.range, t.dir - half, t.dir + half).fillPath();
        g.fillStyle(0xff3040, 0.32).slice(t.x, t.y, t.range * k, t.dir - half, t.dir + half).fillPath();
        g.beginPath().arc(t.x, t.y, t.range, t.dir - half, t.dir + half).strokePath();
      } else if (t.kind === 'lunge') {
        const L = t.range, w = t.width, c = Math.cos(t.dir), sn = Math.sin(t.dir);
        const pts = (u1) => [[0, -w / 2], [u1, -w / 2], [u1, w / 2], [0, w / 2]].map(([u, vv]) => new Phaser.Math.Vector2(t.x + c * u - sn * vv, t.y + sn * u + c * vv));
        g.fillPoints(pts(L), true); g.strokePoints(pts(L), true, true);
        g.fillStyle(0xff3040, 0.32).fillPoints(pts(L * k), true);
      } else if (t.kind === 'shot') {
        g.lineStyle(1, 0xff6070, 0.5 + 0.4 * k).lineBetween(t.x, t.y, t.x + Math.cos(t.dir) * 60, t.y + Math.sin(t.dir) * 60);
      } else {
        g.strokeCircle(t.x, t.y, 14 + 24 * k);
        g.fillStyle(0xff3040, 0.14).fillCircle(t.x, t.y, 10 + 8 * k);
      }
    }
    // 탄
    const sg = this.shotG; sg.clear();
    for (const sh of st.shots) {
      const mine = sh.from === 'player';
      sg.fillStyle(mine ? 0xffe066 : sh.home ? 0x8ad04a : 0xff9a8a, 0.3).fillCircle(sh.x, sh.y, sh.r + 2);
      sg.fillStyle(mine ? 0xfff2b0 : sh.home ? 0xc8ff90 : 0xffe0d8, 1).fillCircle(sh.x, sh.y, sh.r * 0.6);
    }
  }

  slashFx(e) {
    const g = this.add.graphics();
    this.world.add(g);
    const st = this.engine.state;
    if (e.shape === 'arc') {
      const half = (e.arc * Math.PI) / 360;
      g.fillStyle(e.key === 'q' ? 0xffd75e : 0xffffff, 0.5).slice(e.x, e.y, e.range, e.face - half, e.face + half).fillPath();
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

  flash(spr, tint) {
    if (!spr?.setTint) return;
    spr.setTint(0xffffff).setTintMode?.(Phaser.TintModes.FILL);
    this.time.delayedCall(70, () => { if (!spr.active) return; spr.clearTint?.(); spr.setTintMode?.(Phaser.TintModes.MULTIPLY); if (tint) spr.setTint(tint); });
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
    const st = this.engine.state, p = st.p, s = this.s;
    if (this.bossId) {
      const b = st.foes.find((f) => f.id === this.bossId);
      const bw = 520 * s;
      this.bossBar.width = bw * Math.max(0, (b?.hp ?? 0) / (b?.maxHp ?? 1));
      this.bossBarLag.width += (this.bossBar.width - this.bossBarLag.width) * 0.08;
      this.bossStatus.setText(Object.keys(b?.status ?? {}).map((id) => STATUS[id].name).join(' '));
    }
    const left = st.foes.filter((f) => f.hp > 0).length + st.queue.length;
    this.countText.setText(st.total > 1 ? `남은 적 ${left}` : '');
    this.hpBar.width = 206 * s * (p.hp / p.maxHp);
    this.hpBar.fillColor = p.hp / p.maxHp < 0.3 ? 0xe04a4a : p.status.poison ? 0x8ad04a : 0x5ad06a;
    this.hpLag.width += (this.hpBar.width - this.hpLag.width) * 0.08;
    this.regenBar.width = p.regen ? 206 * s * Math.min(1, p.regen.left / 8) : 0;
    this.hpText.setText(`${p.hp}/${p.maxHp}`);
    this.statusText.setText(Object.entries(p.status).map(([id, v]) => `${STATUS[id].name}${v.stack > 1 ? `×${v.stack}` : ''} ${v.left.toFixed(1)}`).join('  '));
    for (const sl of this.slots) {
      const sk = st.skills[sl.k];
      if (first) { sl.name.setText(sk.name).setColor(sk.changed ? '#ffbf47' : '#ffffff'); if (sk.changed) sl.box.setStrokeStyle(2 * s, 0xffbf47); }
      const cdLeft = p.cd[sl.k] ?? 0;
      sl.cd.setSize(56 * s, 48 * s * (cdLeft / sk.cd));
      sl.sec.setText(cdLeft > 0 ? cdLeft.toFixed(1) : '');
      sl.name.setAlpha(cdLeft > 0 ? 0.35 : 1);
    }
    for (const q of this.qslots) {
      if (!q.id) continue;
      const n = st.bag[q.id] ?? 0;
      q.cnt.setText(String(n));
      q.icon?.setAlpha(n > 0 ? 1 : 0.3);
    }
  }

  finish(result) {
    if (this.leaving || this.finished) return;
    this.finished = true;
    const st = this.engine.state;
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
      this.message(this.data0.winLine ?? (this.bossId === 'sweeper' ? '그림자가 먼지처럼 흩어졌다. 빗자루만 남았다.' : '이겼다.'), '#ffd27a');
      const n = this.loot() + this.bossLoot() + this.bounty();
      this.time.delayedCall(1500 + n * 700, () => this.leave('win'));
      return;
    }
    this.message('쓰러졌다.', '#ff7a6a');
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
      const t = this.add.text(W / 2, H * 0.5 + 30 * this.s, `동전 +${coins}${COIN}`, { fontFamily: FONT, fontSize: `${14 * this.s}px`, color: '#ffd27a' }).setOrigin(0.5).setShadow(1, 1, '#000', 0).setAlpha(0).setDepth(60);
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
      const t = this.add.text(W / 2, H * 0.5 - i * 26 * this.s, `${d.text}  — ${it?.name ?? d.item}${d.n > 1 ? ` ×${d.n}` : ''}`, { fontFamily: FONT, fontSize: `${13 * this.s}px`, color: r.glow }).setOrigin(0.5).setShadow(1, 1, '#000', 0).setAlpha(0).setDepth(60);
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
      const t = this.add.text(W / 2, H * 0.36 + i * 30 * this.s, `획득 — ${it.name}`, { fontFamily: FONT_TALK, fontSize: `${18 * this.s}px`, color: r.glow }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0).setScale(0.5);
      this.add.text(W / 2, H * 0.36 + 22 * this.s + i * 30 * this.s, it.desc, { fontFamily: FONT, fontSize: `${12 * this.s}px`, color: '#ffffff' }).setOrigin(0.5).setDepth(60).setShadow(1, 1, '#000', 0);
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
    const { victim } = WorldMemory.load();
    Sound.sfx(this, 'spirit', { detune: -1200 });
    this.cameras.main.flash(500, 230, 225, 240);
    this.time.delayedCall(550, () => this.scene.restart({ ...this.data0, seed: (this.data0.seed ?? 1) + WorldMemory.world.loads, victim }));
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
