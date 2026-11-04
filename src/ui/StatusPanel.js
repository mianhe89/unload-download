// 상태 창 (C 또는 Tab): 캐릭터 시트. 숨기는 수치는 없다(유토피아 판정 제외).
//   왼쪽  주인공 도트(지금 체형·장비), 신분, 체형·마음가짐
//   가운데 전투 능력치 막대 (체형·마음가짐·피로·히든 스킬이 이미 들어간 값)
//   오른쪽 몸(체중·근육·피로 — 체형이 바뀌는 문턱 표시)과 마음가짐 세 갈래
//   아래  히든 스킬 휘장
// 열려 있는 동안 주인공은 멈춘다. C·Tab·Esc 닫기.
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { battleStats, freshLife } from '../life/life.js';
import { applySkills } from '../farm/farm.js';
import { BODIES } from '../battle/body.js';
import { MINDS } from '../../content/life/life.js';
import { PARTY } from '../../content/battles/units.js';
import { HIDDEN_SKILLS } from '../../content/farm/farm.js';
import { RARITY, GRADE_RARITY } from '../../content/items/items.js';
import { EQUIP_DEFAULT, ACTIVE_SLOTS } from '../../content/action/action.js';
import { ITEMS } from '../../content/items.js';

const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);
const rankOf = (flags = {}) => (flags['rank.regent'] ? '영주 대리' : flags['rank.squire'] ? '견습 기사' : '마을 청년');

export class StatusPanel {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.box = null;
    this.body = { text: '' }; // 화면에 적힌 글 전부 (테스트가 읽는다)
    scene.input.keyboard.on('keydown-ESC', () => { if (this.open) this.close(); });
  }

  get open() { return Boolean(this.box); }

  field() {
    for (const key of ['Field', 'Area']) if (this.scene.scene.isActive(key)) return this.scene.scene.get(key);
    return null;
  }

  toggle() { if (this.open) this.close(); else if (WorldMemory.run) this.show(); }
  show() { this.field()?.setFrozen?.(true); this.render(); }
  close() { this.box?.destroy(); this.box = null; this.field()?.setFrozen?.(false); }

  render() {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const run = WorldMemory.run;
    const life = run.life ?? freshLife();
    const farm = run.farm ?? { skills: [] };
    const st = applySkills(battleStats(PARTY.me, life), farm.skills);
    const body = BODIES[st.body], mind = MINDS[st.mind];
    const eq = { ...EQUIP_DEFAULT, ...(run.equip ?? {}) };
    const gearAtk = ACTIVE_SLOTS.reduce((a, k) => a + (ITEMS[eq[k]]?.atk ?? 0), 0);
    const gearDef = ACTIVE_SLOTS.reduce((a, k) => a + (ITEMS[eq[k]]?.def ?? 0), 0);
    const words = [];
    const T = (x, y, str, o = {}) => { words.push(str); return text(sc, x, y, str, o); };

    const W = 760 * s, H = 400 * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(200));
    box.add(sc.add.rectangle(0, 0, width, height, 0x000000, 0.35).setOrigin(0, 0).setInteractive());
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false });
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, '상태', s));
    const panel = (x, w, label) => {
      g.fillStyle(0x000000, 0.18).fillRoundedRect(x, y0 + 34 * s, w, H - 104 * s, 6 * s);
      box.add(T(x + 12 * s, y0 + 44 * s, label, { size: 12, bold: true, color: COLORS.accent }));
    };

    // ── 왼쪽: 나 ─────────────────────────────
    const lx = x0 + 24 * s, lw = 190 * s;
    panel(lx, lw, '나');
    const skin = this.field()?.player?.sprite?.texture?.key ?? 'char.me';
    const cx = lx + lw / 2;
    g.fillStyle(0x000000, 0.25).fillEllipse(cx, y0 + 172 * s, 70 * s, 14 * s);
    if (sc.textures.exists(skin)) box.add(sc.add.image(cx, y0 + 120 * s, skin, 0).setScale(6 * s));
    box.add(T(cx, y0 + 196 * s, rankOf(run.flags), { size: 13, bold: true }).setOrigin(0.5, 0.5));
    const chip = (y, label, value, color) => {
      g.fillStyle(0x000000, 0.25).fillRoundedRect(lx + 14 * s, y - 11 * s, lw - 28 * s, 22 * s, 5 * s);
      box.add(T(lx + 24 * s, y, label, { size: 10, color: COLORS.dim }).setOrigin(0, 0.5));
      box.add(T(lx + lw - 24 * s, y, value, { size: 11, bold: true, color }).setOrigin(1, 0.5));
    };
    chip(y0 + 226 * s, '체형', body.name, COLORS.text);
    chip(y0 + 254 * s, '마음가짐', mind.name, COLORS.text);
    chip(y0 + 282 * s, '장비', gearDef ? `공격 +${gearAtk} · 피해 -${Math.round(gearDef * 100)}%` : `공격 +${gearAtk}`, COLORS.sub);

    // ── 가운데: 전투 능력치 ─────────────────────────────
    const mx = lx + lw + 14 * s, mw = 250 * s;
    panel(mx, mw, '전투 능력치');
    const bar = (x, y, w, ratio, color, marks = []) => {
      g.fillStyle(0x1a120e, 1).fillRoundedRect(x, y - 4 * s, w, 8 * s, 3 * s);
      g.fillStyle(color, 1).fillRoundedRect(x, y - 4 * s, Math.max(3 * s, w * Math.min(1, Math.max(0, ratio))), 8 * s, 3 * s);
      g.fillStyle(0xffffff, 0.18).fillRect(x + 2 * s, y - 3 * s, Math.max(0, w * Math.min(1, ratio) - 4 * s), 2 * s);
      for (const m of marks) g.fillStyle(0xfff4e2, 0.7).fillRect(x + w * m - 0.5 * s, y - 6 * s, 1 * s, 12 * s);
    };
    const STATS = [
      ['체력', st.maxHp, 200, 0xd85a5a, `${st.maxHp}`],
      ['공격', st.atk, 50, 0xe8a040, `${st.atk}`],
      ['방어', st.def, 40, 0x6a9ad8, `${st.def}`],
      ['속도', st.spd, 140, 0x7ac86a, `${st.spd}`],
      ['회피', st.evade, 0.3, 0xb07ae0, `${Math.round(st.evade * 100)}%`],
      ['상태이상 저항', st.resist, 0.6, 0x5ac0b8, `${Math.round(st.resist * 100)}%`],
    ];
    STATS.forEach(([label, v, max, color, shown], i) => {
      const y = y0 + 80 * s + i * 36 * s;
      box.add(T(mx + 14 * s, y - 8 * s, label, { size: 10, color: COLORS.sub }).setOrigin(0, 0.5));
      box.add(T(mx + mw - 14 * s, y - 8 * s, shown, { size: 11, bold: true }).setOrigin(1, 0.5));
      bar(mx + 14 * s, y + 8 * s, mw - 28 * s, v / max, color);
    });
    if (st.startGauge) box.add(T(mx + 14 * s, y0 + H - 84 * s, `전투 시작 게이지 +${st.startGauge}`, { size: 10, color: COLORS.dim }).setOrigin(0, 0.5));

    // ── 오른쪽: 몸과 마음 ─────────────────────────────
    const rx = mx + mw + 14 * s, rw = x0 + W - 24 * s - rx;
    panel(rx, rw, '몸과 마음');
    const bw = rw - 28 * s;
    const row = (y, label, shown, ratio, color, marks) => {
      box.add(T(rx + 14 * s, y - 8 * s, label, { size: 10, color: COLORS.sub }).setOrigin(0, 0.5));
      box.add(T(rx + rw - 14 * s, y - 8 * s, shown, { size: 11, bold: true }).setOrigin(1, 0.5));
      bar(rx + 14 * s, y + 8 * s, bw, ratio, color, marks);
    };
    // 체중 40~130kg: 56 아래 마른, 80 이상 통통. 근육 60 이상이면 근육질
    const wr = (kg) => (kg - 40) / 90;
    row(y0 + 80 * s, '체중', `${life.weight.toFixed(1)}kg`, wr(life.weight), 0xd8b070, [wr(56), wr(80)]);
    row(y0 + 116 * s, '근육', `${Math.round(life.muscle * 100)}`, life.muscle, 0xe07a5a, [0.6]);
    row(y0 + 152 * s, '피로', `${Math.round(life.fatigue)}`, life.fatigue / 100, life.fatigue >= 70 ? 0xd84a4a : 0x8a8aa0, [0.4, 0.7]);
    const top = Math.max(10, ...Object.values(life.mind));
    const MIND_ROWS = [['relaxed', '여유', 0x8ad0e8], ['diligent', '부지런함', 0xf0c860], ['firm', '단단함', 0xd87a6a]];
    MIND_ROWS.forEach(([k, label, color], i) => row(y0 + 200 * s + i * 30 * s, label, `${life.mind[k]}`, life.mind[k] / top, color));
    box.add(T(rx + 14 * s, y0 + H - 92 * s, `${mind.name} — ${mind.desc}`, { size: 9, color: COLORS.dim, wordWrap: { width: rw - 28 * s, useAdvancedWrap: true } }).setOrigin(0, 0));

    // ── 아래: 히든 스킬 · 몸 상태 한마디 ─────────────────────────────
    const by = y0 + H - 50 * s;
    box.add(T(lx, by, '히든 스킬', { size: 11, bold: true, color: COLORS.accent }).setOrigin(0, 0.5));
    let bx = lx + 70 * s;
    if (!farm.skills.length) box.add(T(bx, by, '아직 없다', { size: 10, color: COLORS.dim }).setOrigin(0, 0.5));
    for (const id of farm.skills) {
      const k = HIDDEN_SKILLS[id];
      if (!k) continue;
      const col = RARITY[GRADE_RARITY[k.grade]].glow;
      const label = `${k.grade} ${k.name}`;
      const tw = (label.length * 10 + 20) * s;
      g.fillStyle(hex(col), 0.18).fillRoundedRect(bx, by - 11 * s, tw, 22 * s, 11 * s);
      g.lineStyle(1.5 * s, hex(col), 1).strokeRoundedRect(bx, by - 11 * s, tw, 22 * s, 11 * s);
      box.add(T(bx + tw / 2, by, label, { size: 10, bold: true, color: col }).setOrigin(0.5, 0.5));
      words.push(k.desc);
      bx += tw + 8 * s;
    }
    const tired = life.fatigue >= 70 ? '지쳐 있다. 공격·속도가 10% 떨어졌다.' : life.fatigue >= 40 ? '조금 피곤하다.' : '';
    if (tired) box.add(T(x0 + W - 24 * s, by, tired, { size: 10, color: life.fatigue >= 70 ? '#ff9a8a' : COLORS.sub }).setOrigin(1, 0.5));
    box.add(T(x0 + W - 18 * s, y0 + H - 14 * s, 'C 닫기', { size: 9, color: COLORS.dim }).setOrigin(1, 0.5));
    this.body.text = words.join('\n');
  }
}
