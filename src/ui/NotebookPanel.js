// 수첩 (J): '퀘스트'와 '단서' 두 쪽. 마음의 수치 대신 진행하며 알게 된 것을 다시 읽는 곳이다.
// 열려 있는 동안 주인공은 멈춘다. ←→(A·D) 쪽 넘기기, ↑↓(W·S) 단서 고르기, J·Esc 닫기. 마우스·터치로도 누를 수 있다.
import Phaser from 'phaser';
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { QUESTS } from '../../content/quests/index.js';
import { CLUES } from '../../content/clues.js';

const KIND_NAME = { main: '메인', once: '일회성', repeat: '반복', route: '루트', choice: '선택', heart: '호감도' };
const TABS = [{ id: 'quest', label: '퀘스트' }, { id: 'clue', label: '단서' }];

export class NotebookPanel {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.tab = 'quest';
    this.pick = 0;
    this.box = null;
    const keys = scene.input.keyboard;
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    ['LEFT', 'A'].forEach((k) => on(k, () => this.setTab('quest')));
    ['RIGHT', 'D'].forEach((k) => on(k, () => this.setTab('clue')));
    ['UP', 'W'].forEach((k) => on(k, () => this.move(-1)));
    ['DOWN', 'S'].forEach((k) => on(k, () => this.move(1)));
    on('ESC', () => this.close());
  }

  get open() { return Boolean(this.box); }

  toggle() { if (this.open) this.close(); else if (WorldMemory.run) this.show(); }

  // 열려 있는 동안 필드(마을·길)의 주인공을 멈춘다
  freeze(v) {
    for (const key of ['Field', 'Area']) {
      const sc = this.scene.scene.get(key);
      if (sc && this.scene.scene.isActive(key)) sc.setFrozen?.(v);
    }
  }

  show() { this.freeze(true); this.render(); }

  close() {
    this.box?.destroy();
    this.box = null;
    this.freeze(false);
  }

  setTab(id) { if (this.tab !== id) { this.tab = id; this.pick = 0; this.render(); } }
  move(d) { if (this.tab === 'clue') { this.pick = Phaser.Math.Clamp(this.pick + d, 0, Math.max(0, this.clues().length - 1)); this.render(); } }

  clues() { return CLUES.filter((c) => WorldMemory.hasClue(c.id)); }

  render() {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const W = 680 * s, H = 380 * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(200));
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false }); // 큰 창은 광택 띠가 경계선처럼 보여서 뺀다
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, '수첩', s));

    // 쪽 표시: 퀘스트 / 단서
    TABS.forEach((t, i) => {
      const on = t.id === this.tab;
      const tx = x0 + 36 * s + i * 104 * s, ty = y0 + 34 * s;
      const label = text(sc, tx, ty, t.label, { size: 13, bold: on, color: on ? COLORS.accent : COLORS.dim })
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setTab(t.id));
      box.add(label);
      if (on) box.add(sc.add.rectangle(tx, ty + 20 * s, label.width, 2 * s, COLORS.gold).setOrigin(0, 0.5));
    });
    box.add(sc.add.rectangle(x0 + 24 * s, y0 + 64 * s, W - 48 * s, 1 * s, COLORS.inner).setOrigin(0, 0.5));

    if (this.tab === 'quest') this.renderQuests(box, x0, y0, W, H);
    else this.renderClues(box, x0, y0, W, H);

    box.add(text(sc, x0 + W - 24 * s, y0 + H - 18 * s, '←→ 쪽   ↑↓ 고르기   J 닫기', { size: 10, color: COLORS.dim }).setOrigin(1, 0.5));
  }

  renderQuests(box, x0, y0, W) {
    const sc = this.scene, s = this.s;
    const rows = Object.entries(QUESTS).map(([id, def]) => ({ def, q: WorldMemory.quest(id) })).filter((r) => r.q);
    const active = rows.filter((r) => r.q.state === 'active');
    const done = rows.filter((r) => r.q.state === 'done');
    let y = y0 + 84 * s;
    const left = x0 + 36 * s;
    if (!rows.length) { box.add(text(sc, left, y, '아직 받은 일이 없다.', { size: 13, color: COLORS.dim })); return; }
    for (const { def, q } of active) {
      box.add(text(sc, left, y, `[${KIND_NAME[def.kind] ?? ''}] ${def.title}`, { size: 14, bold: true, color: COLORS.text }));
      y += 24 * s;
      box.add(text(sc, left + 14 * s, y, `› ${def.steps[q.step]?.text ?? ''}`, { size: 12, color: COLORS.narration, wordWrap: { width: W - 90 * s, useAdvancedWrap: true } }));
      y += 34 * s;
    }
    if (done.length) {
      box.add(text(sc, left, y + 4 * s, '끝낸 일', { size: 11, color: COLORS.dim }));
      y += 24 * s;
      for (const { def } of done) { box.add(text(sc, left + 14 * s, y, `✓ ${def.title}`, { size: 12, color: COLORS.dim })); y += 20 * s; }
    }
  }

  renderClues(box, x0, y0, W, H) {
    const sc = this.scene, s = this.s;
    const list = this.clues();
    const left = x0 + 36 * s;
    if (!list.length) { box.add(text(sc, left, y0 + 84 * s, '아직 적어 둔 것이 없다.', { size: 13, color: COLORS.dim })); return; }
    this.pick = Math.min(this.pick, list.length - 1);
    // 왼쪽: 제목 목록 (최근 것이 아래)
    list.forEach((c, i) => {
      const on = i === this.pick;
      const t = text(sc, left, y0 + 84 * s + i * 24 * s, `${on ? '▸ ' : '  '}${c.title}`, { size: 12, bold: on, color: on ? COLORS.accent : COLORS.text })
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.pick = i; this.render(); });
      box.add(t);
    });
    // 오른쪽: 메모
    const rx = x0 + 250 * s;
    box.add(sc.add.rectangle(rx - 16 * s, y0 + 80 * s, 1 * s, H - 120 * s, COLORS.inner).setOrigin(0.5, 0));
    const c = list[this.pick];
    box.add(text(sc, rx, y0 + 84 * s, c.title, { size: 14, bold: true, color: COLORS.accent }));
    box.add(text(sc, rx, y0 + 112 * s, c.text, { size: 12, color: COLORS.text, lineSpacing: 6 * s, wordWrap: { width: x0 + W - 36 * s - rx, useAdvancedWrap: true } }));
  }
}
