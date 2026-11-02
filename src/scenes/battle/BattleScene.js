// 사이드뷰 전투 씬. 규칙은 전부 src/battle/engine.js(순수 로직)에 있고, 여기선 그리고 입력만 받는다.
//   위:   차례 순서(속도 게이지 미리보기), 보스 예고
//   가운데: 왼쪽 아군 / 오른쪽 적, 머리 위 체력 막대
//   아래:   지금 차례인 아군의 스킬 1·2·3, ←→ 대상, Enter/Space/E 실행
// 지면: 되돌리기(로드 = 누군가 지워진다) 또는 물러나기. 이기면 길 맵으로 돌아간다.
import Phaser from 'phaser';
import { FONT } from '../../config/game.js';
import { createBattle } from '../../battle/engine.js';
import { beatKey } from '../../battle/encounters.js';
import { BODIES } from '../../battle/body.js';
import { ELEMENTS } from '../../../content/battles/units.js';
import { MONSTER_ART } from '../../../content/art/pack.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { characters } from '../../../content/characters/index.js';
import { Sound } from '../../core/audio/Sound.js';
import { act, freshLife, skinOf } from '../../life/life.js';

const SKY = { surface: [0x8fb7d8, 0xd9e6c8], under: [0x1c1620, 0x3a2c2a], sky: [0x0a0820, 0x2a1e5a] };
const GROUND = { surface: 0x6c8a3c, under: 0x4a3a30, sky: 0x3a2a6a };
const COLOR = { text: '#f4f0e8', dim: '#8a84a0', red: '#ff7a6a', gold: '#ffd27a', blue: '#9ad0ff' };

export default class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  // enemies, seed, boss, from: { layer, at, key, back }  (돌아갈 길 맵)
  init(data) {
    this.data0 = data;
    this.busy = false;
    this.leaving = false;
    this.cursor = { skill: 0, target: 0 };
    this.sprites = {};
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.s = W / 960;
    if (this.scene.isActive('UI')) this.scene.setVisible(false, 'UI');
    const layer = this.data0.from?.layer ?? 'surface';
    this.battle = createBattle({ enemies: this.data0.enemies, seed: this.data0.seed ?? 1, life: WorldMemory.run?.life ?? null, skills: WorldMemory.run?.farm?.skills ?? [] });

    // 배경
    const [top, bottom] = SKY[layer] ?? SKY.surface;
    const g = this.add.graphics();
    g.fillGradientStyle(top, top, bottom, bottom, 1); g.fillRect(0, 0, W, H * 0.68);
    g.fillStyle(GROUND[layer] ?? GROUND.surface, 1); g.fillRect(0, H * 0.68, W, H * 0.32);
    g.fillStyle(0x000000, 0.18); g.fillRect(0, H * 0.68, W, 6 * this.s);
    if (layer === 'sky') for (let i = 0; i < 80; i += 1) this.add.rectangle(Math.random() * W, Math.random() * H * 0.68, 2, 2, 0xffffff, Math.random());

    // 유닛 배치
    const party = this.battle.units.filter((u) => u.side === 'party');
    const foes = this.battle.units.filter((u) => u.side === 'enemy');
    const baseY = H * 0.62;
    party.forEach((u, i) => this.placeUnit(u, W * (0.18 + i * 0.09), baseY + (i % 2) * 22 * this.s));
    foes.forEach((u, i) => this.placeUnit(u, W * (0.72 + i * 0.1), baseY + (i % 2) * 22 * this.s));

    // 위: 차례 순서, 예고
    this.orderText = this.add.text(16 * this.s, 12 * this.s, '', { fontFamily: FONT, fontSize: `${12 * this.s}px`, color: COLOR.text }).setShadow(1, 1, '#000', 0);
    this.tellText = this.add.text(W / 2, 46 * this.s, '', { fontFamily: FONT, fontSize: `${14 * this.s}px`, color: COLOR.red, align: 'center', wordWrap: { width: W * 0.8 } }).setOrigin(0.5, 0).setShadow(1, 1, '#000', 0);
    this.logText = this.add.text(W / 2, H * 0.71, '', { fontFamily: FONT, fontSize: `${13 * this.s}px`, color: COLOR.text, align: 'center' }).setOrigin(0.5, 0).setShadow(1, 1, '#000', 0);

    // 아래: 명령 창
    this.panel = this.add.container(0, 0);
    this.panelBg = this.add.rectangle(W / 2, H - 62 * this.s, W - 24 * this.s, 104 * this.s, 0x101018, 0.9).setStrokeStyle(2, 0x4a4466);
    this.who = this.add.text(28 * this.s, H - 108 * this.s, '', { fontFamily: FONT, fontSize: `${13 * this.s}px`, color: COLOR.gold });
    this.skillTexts = [0, 1, 2, 3].map((i) => this.add.text(28 * this.s + i * 228 * this.s, H - 84 * this.s, '', { fontFamily: FONT, fontSize: `${12 * this.s}px`, color: COLOR.text, wordWrap: { width: 218 * this.s } })
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.cursor.skill = i; this.confirm(); }));
    this.hint = this.add.text(W - 28 * this.s, H - 108 * this.s, '1·2·3 스킬  4 궁극기  ←→ 대상  Enter 실행', { fontFamily: FONT, fontSize: `${11 * this.s}px`, color: COLOR.dim }).setOrigin(1, 0);
    this.panel.add([this.panelBg, this.who, ...this.skillTexts, this.hint]);
    this.panel.setVisible(false);
    this.targetMark = this.add.text(0, 0, '▼', { fontFamily: FONT, fontSize: `${16 * this.s}px`, color: COLOR.gold }).setOrigin(0.5, 1).setVisible(false);
    this.tweens.add({ targets: this.targetMark, y: '+=4', duration: 400, yoyo: true, repeat: -1 });

    // 입력
    const kb = this.input.keyboard;
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.pickSkill(i)));
    kb.on('keydown-LEFT', () => this.moveTarget(-1));
    kb.on('keydown-RIGHT', () => this.moveTarget(1));
    kb.on('keydown-A', () => this.moveTarget(-1));
    kb.on('keydown-D', () => this.moveTarget(1));
    ['ENTER', 'SPACE', 'E'].forEach((k) => kb.on(`keydown-${k}`, () => this.confirm()));

    this.cameras.main.fadeIn(400, 0, 0, 0);
    Sound.music(this, this.data0.boss ? 'boss' : 'battle', { fade: 300 });
    Sound.ambient(this, null);
    // 되돌린 직후면 누가 지워졌는지 한 줄 (이름은 나만 기억한다)
    const opening = this.data0.victim ? `…되돌렸다. ${characters[this.data0.victim]?.name ?? '누군가'}의 얼굴이 잘 떠오르지 않는다.` : this.data0.note;
    if (opening) this.say(opening, this.data0.victim ? COLOR.red : COLOR.text);
    this.time.delayedCall(opening ? 1600 : 500, () => this.step());
  }

  placeUnit(u, x, y) {
    const s = this.s;
    let spr;
    if (u.side === 'party') {
      const skin = u.id === 'me' ? skinOf(WorldMemory.run?.life) : u.id; // 주인공은 체형별 도트
      const key = this.textures.exists(`char.${skin}`) ? `char.${skin}` : `char.${u.id}`;
      spr = this.add.sprite(x, y, key, 3).setScale(4 * s).setOrigin(0.5, 1);
      if (this.anims.exists(`${key}.right`)) spr.play(`${key}.right`);
      spr.anims?.pause();
    } else {
      const art = MONSTER_ART[u.sprite];
      spr = this.add.sprite(x, y, `mon.${u.sprite}`, art.kind === 'walker' ? 2 : 0).setScale((art.kind === 'walker' ? 4 : 3) * s).setOrigin(0.5, 1);
      if (this.anims.exists(`mon.${u.sprite}`)) spr.play(`mon.${u.sprite}`);
      if (u.boss) spr.setAlpha(0.9);
      // 터치: 적을 누르면 대상으로, 한 번 더 누르면 실행
      spr.setInteractive().on('pointerdown', () => {
        const i = this.targets().findIndex((t) => t.uid === u.uid);
        if (i < 0 || this.busy || !this.panel.visible) return;
        if (this.cursor.target === i) this.confirm(); else { this.cursor.target = i; this.highlight(); }
      });
    }
    this.add.ellipse(x, y, 46 * s * (u.boss ? 2 : 1), 10 * s, 0x000000, 0.25).setDepth(-1);
    const top = y - spr.displayHeight;
    const name = this.add.text(x, top - 26 * s, u.name, { fontFamily: FONT, fontSize: `${11 * s}px`, color: u.side === 'party' ? COLOR.blue : COLOR.red }).setOrigin(0.5, 1).setShadow(1, 1, '#000', 0);
    const barBg = this.add.rectangle(x, top - 16 * s, 60 * s, 6 * s, 0x000000, 0.6);
    const bar = this.add.rectangle(x - 30 * s, top - 16 * s, 60 * s, 6 * s, u.side === 'party' ? 0x6ad08a : 0xe06a5a).setOrigin(0, 0.5);
    const gauge = this.add.rectangle(x - 30 * s, top - 10 * s, 0, 2 * s, 0xffd27a).setOrigin(0, 0.5);
    // 궁극기 게이지 (아군만, 보라색)
    const burst = u.ultimate ? this.add.rectangle(x - 30 * s, top - 7 * s, 0, 2 * s, 0xb9a8ff).setOrigin(0, 0.5) : null;
    this.sprites[u.uid] = { spr, name, bar, barBg, gauge, burst, x, y, top };
  }

  refresh() {
    for (const u of this.battle.units) {
      const v = this.sprites[u.uid];
      v.bar.width = 60 * this.s * (u.hp / u.maxHp);
      v.gauge.width = 60 * this.s * Math.min(1, u.gauge / 100);
      if (v.burst) { v.burst.width = 60 * this.s * Math.min(1, u.burst / 100); v.burst.setFillStyle(u.burst >= 100 ? 0xffffff : 0xb9a8ff); }
      const dead = u.hp <= 0;
      v.spr.setAlpha(dead ? 0.25 : u.boss ? 0.9 : 1);
      v.name.setText(`${u.name}${u.guard ? ' [방어]' : ''}${u.status?.burn ? ' [화상]' : ''}`);
    }
    const names = Object.fromEntries(this.battle.units.map((u) => [u.uid, u.name]));
    this.orderText.setText(`차례  ${this.battle.preview(7).map((id) => names[id]).join(' › ')}`);
    const tele = this.battle.units.find((u) => u.telegraph && u.hp > 0);
    this.tellText.setText(tele ? `!! ${tele.name}: ${tele.skills.find((s) => s.id === tele.telegraph.skill).tell}` : '');
  }

  say(text, color = COLOR.text) { this.logText.setText(text).setColor(color); }

  // 다음 차례
  step() {
    this.refresh();
    const r = this.battle.result;
    if (r) { this.finish(r); return; }
    const u = this.battle.next();
    this.current = u;
    this.refresh();
    if (u.side === 'party') { this.openPanel(u); return; }
    this.busy = true;
    this.time.delayedCall(550, () => this.play(this.battle.enemyTurn(u.uid), u));
  }

  openPanel(u) {
    this.busy = false;
    const usable = new Set(this.battle.usable(u).map((s) => s.id));
    this.who.setText(`${u.name}의 차례${u.body ? `  · 체형 ${BODIES[u.body].name} (회피 ${Math.round(u.evade * 100)}%)` : ''}`);
    // 4번: 궁극기
    if (u.ultimate) {
      const ready = this.battle.canBurst(u);
      this.skillTexts[3].setText(`4. ${u.ultimate.name}\n${ready ? u.ultimate.desc : `게이지 ${Math.floor(u.burst)}%`}`).setColor(ready ? COLOR.gold : COLOR.dim);
    } else this.skillTexts[3].setText('');
    u.skills.forEach((s, i) => {
      const cd = u.cooldowns[s.id] ?? 0;
      const tag = s.element ? ` [${ELEMENTS[s.element]}]` : '';
      const desc = s.desc ?? (s.hits ? `${s.target === 'all' ? '적 전체' : '적 하나'} · ${s.hits}타` : '');
      this.skillTexts[i].setText(`${i + 1}. ${s.name}${tag}\n${usable.has(s.id) ? desc : `쉬는 중 (${cd})`}`).setColor(usable.has(s.id) ? COLOR.text : COLOR.dim);
    });
    this.cursor.skill = [0, 1, 2].find((i) => usable.has(u.skills[i].id)) ?? 0;
    this.cursor.target = Math.min(this.cursor.target, this.targets().length - 1);
    this.panel.setVisible(true);
    this.highlight();
  }

  // 지금 고른 칸의 스킬 (4번째 = 궁극기)
  chosen() {
    const u = this.current;
    return this.cursor.skill === 3 ? u?.ultimate : u?.skills[this.cursor.skill];
  }

  canUse(i) {
    const u = this.current;
    if (i === 3) return this.battle.canBurst(u);
    return this.battle.usable(u).some((s) => s.id === u.skills[i].id);
  }

  targets() {
    const s = this.chosen();
    if (!s) return [];
    if (s.target === 'ally') return this.battle.units.filter((x) => x.side === 'party' && x.hp > 0);
    if (s.target === 'one') return this.battle.units.filter((x) => x.side === 'enemy' && x.hp > 0);
    return [];
  }

  highlight() {
    this.skillTexts.forEach((t, i) => t.setBackgroundColor(i === this.cursor.skill ? '#2a2640' : null));
    const ts = this.targets();
    const t = ts[this.cursor.target % Math.max(1, ts.length)];
    if (t) { const v = this.sprites[t.uid]; this.targetMark.setPosition(v.x, v.top - 30 * this.s).setVisible(true); } else this.targetMark.setVisible(false);
  }

  pickSkill(i) {
    if (this.busy || !this.panel.visible) return;
    Sound.sfx(this, 'ui', { volume: 0.2 });
    if (!this.canUse(i)) return;
    if (this.cursor.skill === i) { this.confirm(); return; } // 같은 숫자 두 번 = 바로 실행
    this.cursor.skill = i; this.cursor.target = 0; this.highlight();
  }

  moveTarget(d) {
    if (this.busy || !this.panel.visible) return;
    const n = this.targets().length;
    if (n) { this.cursor.target = (this.cursor.target + d + n) % n; this.highlight(); }
  }

  confirm() {
    if (this.busy || !this.panel.visible) return;
    const u = this.current;
    if (!this.canUse(this.cursor.skill)) return;
    const s = this.chosen();
    const t = this.targets()[this.cursor.target];
    this.busy = true;
    this.panel.setVisible(false);
    this.targetMark.setVisible(false);
    this.play(this.battle.use(u.uid, s.id, t?.uid), u);
  }

  // 이벤트 연출: 한 줄씩 짧게
  play(events, actor, cutDone = false) {
    // 궁극기는 컷인을 먼저 보여주고 나서
    const ult = events.find((e) => e.type === 'skill' && e.ultimate);
    if (ult && !cutDone) { this.cutin(actor, ult, () => this.play(events, actor, true)); return; }
    const v = this.sprites[actor.uid];
    const dir = actor.side === 'party' ? 1 : -1;
    this.tweens.add({ targets: v.spr, x: v.x + 18 * this.s * dir, duration: 120, yoyo: true });
    let delay = 0;
    for (const e of events) {
      this.time.delayedCall(delay, () => this.show(e));
      delay += e.type === 'hit' ? 160 : 60;
    }
    this.time.delayedCall(delay + 450, () => this.step());
  }

  show(e) {
    const name = (uid) => this.battle.units.find((u) => u.uid === uid)?.name;
    if (e.type === 'skill') this.say(`${name(e.from)} — ${e.name}`);
    if (e.type === 'telegraph') { this.say(`${name(e.from)}: ${e.name} 준비`, COLOR.red); this.cameras.main.shake(200, 0.004); Sound.sfx(this, 'tell'); }
    if (e.type === 'hit') {
      const v = this.sprites[e.to];
      Sound.sfx(this, e.evaded ? 'step' : e.dmg > 30 ? 'heavy' : 'hit', { rate: 0.9 + Math.random() * 0.2 });
      const txt = e.evaded ? '회피' : `${e.dmg}${e.mul > 1 ? '!' : ''}`;
      const col = e.evaded ? COLOR.blue : e.mul > 1 ? COLOR.gold : e.mul < 1 ? COLOR.dim : COLOR.text;
      const t = this.add.text(v.x + (Math.random() - 0.5) * 20 * this.s, v.top, txt, { fontFamily: FONT, fontSize: `${(e.evaded ? 13 : 16) * this.s}px`, color: col }).setOrigin(0.5).setShadow(2, 2, '#000', 0);
      this.tweens.add({ targets: t, y: t.y - 34 * this.s, alpha: 0, duration: 800, onComplete: () => t.destroy() });
      if (!e.evaded) { v.spr.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL); this.time.delayedCall(70, () => v.spr.clearTint().setTintMode(Phaser.TintModes.MULTIPLY)); if (e.dmg > 30) this.cameras.main.shake(140, 0.006); }
      this.refresh();
    }
    if (e.type === 'ko') this.refresh();
    if (e.type === 'burn' || e.type === 'status' || e.type === 'resist' || e.type === 'cancel') {
      const v = this.sprites[e.to];
      const txt = { burn: `화상 ${e.dmg}`, status: '화상!', resist: '버텼다', cancel: '예고가 지워졌다' }[e.type];
      const col = e.type === 'resist' ? COLOR.blue : e.type === 'cancel' ? COLOR.gold : '#ff9a4a';
      const t = this.add.text(v.x, v.top - 8 * this.s, txt, { fontFamily: FONT, fontSize: `${13 * this.s}px`, color: col }).setOrigin(0.5).setShadow(2, 2, '#000', 0);
      this.tweens.add({ targets: t, y: t.y - 28 * this.s, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      if (e.type === 'cancel') { this.say(`${name(e.to)}의 예고가 지워졌다`, COLOR.gold); Sound.sfx(this, 'spirit'); }
      if (e.type === 'burn') Sound.sfx(this, 'hit', { volume: 0.2, rate: 0.7 });
      this.refresh();
    }
    if (e.type === 'heal') Sound.sfx(this, 'heal');
    if (e.type === 'guard' || e.type === 'gauge') Sound.sfx(this, 'skill', { volume: 0.25 });
    if (e.type === 'heal' || e.type === 'guard' || e.type === 'gauge') this.refresh();
  }

  // 궁극기 컷인: 화면을 가로지르는 띠 + 큰 얼굴 + 한마디
  cutin(u, e, done) {
    const { width: W, height: H } = this.scale;
    const s = this.s;
    Sound.sfx(this, 'secret', { volume: 0.4 });
    const band = this.add.rectangle(W / 2, H * 0.38, W, 150 * s, 0x0b0b14, 0.92).setDepth(300).setScale(1, 0);
    const stripe = this.add.rectangle(W / 2, H * 0.38 + 72 * s, W, 4 * s, 0xb9a8ff).setDepth(301).setScale(0, 1);
    const face = this.textures.exists(`face.${u.id}`) ? this.add.image(-200 * s, H * 0.38, `face.${u.id}`).setScale(3.4 * s).setDepth(302) : null;
    const name = this.add.text(W * 0.36, H * 0.38 - 40 * s, e.name, { fontFamily: FONT, fontSize: `${26 * s}px`, color: '#ffffff' }).setDepth(302).setAlpha(0).setShadow(2, 2, '#000', 0);
    const line = this.add.text(W * 0.36, H * 0.38 + 6 * s, e.line ?? '', { fontFamily: FONT, fontSize: `${15 * s}px`, color: COLOR.gold }).setDepth(302).setAlpha(0);
    this.tweens.add({ targets: band, scaleY: 1, duration: 160, ease: 'Quad.out' });
    this.tweens.add({ targets: stripe, scaleX: 1, duration: 260, delay: 80 });
    if (face) this.tweens.add({ targets: face, x: W * 0.2, duration: 260, delay: 60, ease: 'Back.out' });
    this.tweens.add({ targets: [name, line], alpha: 1, x: '+=12', duration: 220, delay: 180 });
    this.time.delayedCall(1100, () => {
      this.cameras.main.flash(180, 255, 255, 255);
      [band, stripe, face, name, line].forEach((o) => o?.destroy());
      done();
    });
  }

  finish(result) {
    // 싸움의 대가: 칼로리를 쓰고 피로가 쌓인다 (생활 → 체형)
    if (WorldMemory.run) WorldMemory.setLife(act(WorldMemory.run.life ?? freshLife(), 'battle'));
    this.panel.setVisible(false);
    this.targetMark.setVisible(false);
    const { width: W, height: H } = this.scale;
    const from = this.data0.from;
    Sound.music(this, null, { fade: 300 });
    Sound.sfx(this, result === 'win' ? 'win' : 'lose');
    if (result === 'win') {
      if (from?.key) WorldMemory.setFlag(`beat.${beatKey(from.key, this.data0.boss)}`);
      this.say(this.data0.boss ? '그림자가 먼지처럼 흩어졌다. 빗자루만 남았다.' : '이겼다.', COLOR.gold);
      this.time.delayedCall(1500, () => this.leave());
      return;
    }
    // 졌다: 되돌리면 누군가 지워진다
    this.say('쓰러졌다.', COLOR.red);
    const opts = [
      { label: '되돌리기 — 이 순간, 누군가 지워진다', act: () => this.retry() },
      { label: '물러나기', act: () => this.leave() },
    ];
    this.choices = opts.map((o, i) => this.add.text(W / 2, H * 0.8 + i * 30 * this.s, o.label, { fontFamily: FONT, fontSize: `${15 * this.s}px`, color: i ? COLOR.text : COLOR.red })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', o.act).setShadow(1, 1, '#000', 0));
    this.input.keyboard.once('keydown-R', () => this.retry());
    this.input.keyboard.once('keydown-ESC', () => this.leave());
  }

  // 재시도 = 로드 = 세계선 이동. 대가로 한 명이 지워진다 (기획서 '어렵지만 공정한 전투')
  retry() {
    if (this.leaving) return;
    this.leaving = true;
    const { victim } = WorldMemory.load();
    Sound.sfx(this, 'spirit', { detune: -1200 });
    this.cameras.main.flash(500, 255, 255, 255);
    this.time.delayedCall(550, () => this.scene.restart({ ...this.data0, seed: (this.data0.seed ?? 1) + WorldMemory.world.loads, victim }));
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
