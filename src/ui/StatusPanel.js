// 스테이터스 창 (C 또는 Tab): 체중·체형·마음가짐과 그 전투 보정. 숨기는 수치는 없다(유토피아 판정 제외).
import { FONT } from '../config/game.js';
import { RichText } from './RichText.js';
import { GRADE_RARITY } from '../../content/items/items.js';
import { EQUIP_DEFAULT } from '../../content/action/action.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { statusLines, freshLife } from '../life/life.js';
import { PARTY } from '../../content/battles/units.js';
import { HIDDEN_SKILLS } from '../../content/farm/farm.js';

export class StatusPanel {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = width / 960;
    this.box = scene.add.container(width / 2, height / 2).setDepth(200).setVisible(false);
    const bg = scene.add.rectangle(0, 0, 640 * s, 290 * s, 0x101018, 0.94).setStrokeStyle(2 * s, 0x4a4466);
    this.title = scene.add.text(-300 * s, -130 * s, '나', { fontFamily: FONT, fontSize: `${15 * s}px`, color: '#ffd27a' });
    this.body = new RichText(scene, -300 * s, -108 * s, { font: FONT, size: 12 * s, color: '#ece8f4', lineHeight: 1.9, dark: true, maxWidth: 600 * s });
    this.foot = scene.add.text(300 * s, 130 * s, 'C 닫기', { fontFamily: FONT, fontSize: `${11 * s}px`, color: '#8a84a0' }).setOrigin(1, 1);
    this.box.add([bg, this.title, this.body.container, this.foot]);
  }

  get open() { return this.box.visible; }

  toggle() {
    if (!WorldMemory.run) return;
    if (this.open) { this.box.setVisible(false); return; }
    const farm = WorldMemory.run.farm ?? { items: {}, skills: [] };
    // 아이템·스킬 이름은 등급 색으로
    const items = Object.entries(farm.items).map(([k, n]) => `[i=${k}] ${n}`).join(' · ');
    const skills = farm.skills.map((id) => { const k = HIDDEN_SKILLS[id]; return `[q=${GRADE_RARITY[k.grade]}]〔${k.grade}〕 ${k.name}[/q] — ${k.desc}`; });
    const eq = { ...EQUIP_DEFAULT, ...(WorldMemory.run.equip ?? {}) };
    const gear = ['weapon', 'armor', 'trinket'].map((k) => (eq[k] ? `[i=${eq[k]}]` : '—')).join(' · ');
    this.body.set([...statusLines(PARTY.me, WorldMemory.run.life ?? freshLife()), `장비: ${gear}`, items ? `가진 것: ${items}` : '', ...skills].filter(Boolean).join('\n'));
    this.body.reveal(Infinity);
    this.box.setVisible(true);
  }
}
