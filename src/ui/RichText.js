// 꾸민 대사를 화면에 그리고 한 글자씩 찍는다.
// - 같은 꾸밈이 이어지는 글자들은 글자 객체 하나로 (가볍게), 떨림·물결 글자만 한 글자씩 따로 움직인다.
// - 노란 강조는 글자 뒤에 형광펜을 긋는다.
import { parseRich, layout, delayAfter, colorOf, voiced } from './rich.js';

const ctx2d = (() => {
  if (typeof document === 'undefined') return null;
  return document.createElement('canvas').getContext('2d');
})();

export class RichText {
  // opts: font, size, color, maxWidth, lineHeight(배수), mark(형광펜 색 0xRRGGBB), shadow, dark(어두운 바탕: 밝은 강조색, 형광펜 없음)
  constructor(scene, x, y, opts) {
    this.scene = scene;
    this.o = { lineHeight: 1.7, mark: 0xffe066, ...opts };
    this.container = scene.add.container(x, y);
    this.parts = [];
    this.glyphs = [];
    this.shown = 0;
  }

  measure(g) {
    const size = this.o.size * (g.big ? 1.5 : 1);
    if (!ctx2d) return size * (g.ch.charCodeAt(0) > 0x2e80 ? 1 : 0.55);
    ctx2d.font = `${size}px ${this.o.font}`;
    return ctx2d.measureText(g.ch).width;
  }

  get lineH() { return Math.round(this.o.size * this.o.lineHeight); }

  // 대사를 놓는다 (아직 안 보임). 표정 태그가 있으면 돌려준다
  set(text, maxWidth = this.o.maxWidth) {
    this.clear();
    const { glyphs, mood, emote } = parseRich(text);
    const { glyphs: laid, lines } = layout(glyphs, (g) => this.measure(g), maxWidth);
    this.glyphs = laid;
    this.lines = lines;
    this.width = laid.reduce((m, g) => Math.max(m, g.x + g.w), 0);
    this.height = lines * this.lineH;
    // 글자 묶음 만들기
    let run = null;
    laid.forEach((g, i) => {
      if (g.ch === '\n') { run = null; return; }
      const key = `${g.line}|${g.color}|${g.big}|${g.item ?? ''}`;
      const solo = Boolean(g.fx);
      if (!solo && run && run.key === key && !run.solo) { run.end = i; return; }
      run = { key, solo, start: i, end: i, g };
      this.parts.push(run);
    });
    for (const p of this.parts) {
      const g = p.g;
      const size = this.o.size * (g.big ? 1.5 : 1);
      const color = colorOf(g.color, this.o.color, this.o.dark);
      const y = (g.line + 1) * this.lineH - Math.round((this.lineH - this.o.size) / 2);
      if (g.color === 'mark' && !this.o.dark) {
        const w = laid.slice(p.start, p.end + 1).reduce((s, x) => s + x.w, 0);
        p.mark = this.scene.add.rectangle(g.x - 1, y - this.o.size * 0.42, w + 2, this.o.size * 0.62, this.o.mark, 0.85).setOrigin(0, 0.5);
        p.mark.fullW = w + 2;
        p.mark.setVisible(false);
        this.container.add(p.mark);
      }
      p.text = this.scene.add.text(g.x, y, '', { fontFamily: this.o.font, fontSize: `${size}px`, color }).setOrigin(0, 1);
      if (g.color && g.color.startsWith('rarity.')) p.text.setFontStyle('bold');
      if (this.o.shadow) p.text.setShadow(1, 1, this.o.shadow, 0, false, true);
      p.baseY = y;
      this.container.add(p.text);
    }
    this.shown = 0;
    return { mood, emote, lines, width: this.width, height: this.height };
  }

  // 앞에서부터 n글자 보이기
  reveal(n) {
    this.shown = Math.min(n, this.glyphs.length);
    for (const p of this.parts) {
      const upto = Math.min(this.shown - 1, p.end);
      if (upto < p.start) { p.text.setText(''); p.mark?.setVisible(false); continue; }
      p.text.setText(this.glyphs.slice(p.start, upto + 1).map((g) => g.ch).join(''));
      if (p.mark) {
        const w = this.glyphs.slice(p.start, upto + 1).reduce((s, x) => s + x.w, 0) + 2;
        p.mark.setVisible(true).setSize(w, p.mark.height);
      }
    }
  }

  // 보이는 글자 그대로 (테스트·접근성용)
  get text() { return this.glyphs.map((g) => g.ch).join(''); }

  get done() { return this.shown >= this.glyphs.length; }

  // 한 글자씩 찍기. onChar(glyph, i) — 소리 등. 돌려주는 Promise는 다 찍히면 끝난다
  // 프레임이 느려도 제 속도로: 실제로 흐른 시간만큼 여러 글자를 한 번에 찍는다 (소리는 마지막 글자만)
  typingStep() {
    const t = this.typer;
    if (!t) return;
    // 실제 흐른 시간 (게임 시계는 느린 기기에서 늦게 갈 수 있다)
    const now = performance.now();
    t.wait -= now - (t.at ?? now);
    t.at = now;
    let last = null;
    while (t.wait <= 0 && this.shown < this.glyphs.length) {
      const i = this.shown;
      this.shown += 1;
      if (voiced(this.glyphs[i].ch)) last = i;
      t.wait += delayAfter(this.glyphs, i, t.speed);
    }
    this.reveal(this.shown);
    if (last !== null) t.onChar?.(this.glyphs[last], last);
    if (this.shown >= this.glyphs.length) { this.stopTyping(); t.resolve(); }
  }

  type({ speed = 30, onChar } = {}) {
    this.stopTyping();
    return new Promise((resolve) => {
      const tick = () => this.typingStep();
      this.typer = { speed, onChar, resolve, wait: 0, tick };
      this.finishTyping = () => { this.stopTyping(); this.reveal(this.glyphs.length); resolve(); };
      this.scene.events.on('update', tick);
      this.typingStep();
    });
  }

  stopTyping() { if (this.typer) this.scene.events.off('update', this.typer.tick); this.typer = null; }
  skip() { this.finishTyping?.(); }
  get typing() { return Boolean(this.typer); }

  // 떨림·물결 (매 프레임)
  update(time) {
    for (const p of this.parts) {
      if (!p.solo) continue;
      const g = p.g;
      if (g.fx === 'shake') p.text.setPosition(g.x + (Math.random() * 2 - 1), p.baseY + (Math.random() * 2 - 1));
      else if (g.fx === 'wave') p.text.setY(p.baseY + Math.sin(time / 140 + p.start * 0.7) * this.o.size * 0.18);
    }
  }

  clear() {
    this.stopTyping();
    this.parts.forEach((p) => { p.text.destroy(); p.mark?.destroy(); });
    this.parts = [];
    this.glyphs = [];
    this.shown = 0;
  }

  destroy() { this.clear(); this.container.destroy(); }
}
