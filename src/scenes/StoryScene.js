import Phaser from 'phaser';
import { WorldMemory } from '../systems/WorldMemory.js';
import { ScriptRunner } from '../systems/ScriptRunner.js';
import { characters } from '../../data/story/characters.js';
import { script, locations } from '../../data/story/prologue.js';

// 비주얼노벨 파트: 대사, 선택지, 장소, 연출.
// 클릭 / Space / Enter 로 진행. 타이핑 중에 누르면 문장을 즉시 완성.
export default class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }

  init(data) {
    this.run = data.run;
    this.victim = data.victim ?? null;
  }

  create() {
    const { width, height } = this.scale;
    const s = (this.s = width / 960);
    const world = WorldMemory.state;

    this.runner = new ScriptRunner(script, {
      run: this.run,
      loads: world.loads,
      erasedCount: world.erased.length,
      isErased: (id) => WorldMemory.isErased(id),
    });

    // 세계가 지워질수록 색이 빠진다 (붕괴 1~3단계의 최소 연출)
    this.desat = Math.min(world.erased.length * 0.18, 0.72);

    this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0x111111);
    this.place = this.add.text(24 * s, 18 * s, '', {
      fontFamily: 'serif', fontSize: `${15 * s}px`, color: '#bdb6cf',
    });

    const boxH = 150 * s;
    this.box = this.add.rectangle(width / 2, height - boxH / 2 - 16 * s, width - 48 * s, boxH, 0x14121c, 0.9)
      .setStrokeStyle(1, 0x3a3550);
    this.nameText = this.add.text(48 * s, height - boxH - 6 * s, '', {
      fontFamily: 'sans-serif', fontSize: `${16 * s}px`, fontStyle: 'bold',
    });
    this.bodyText = this.add.text(48 * s, height - boxH + 22 * s, '', {
      fontFamily: 'sans-serif', fontSize: `${18 * s}px`, color: '#ece8f4',
      lineSpacing: 6 * s, wordWrap: { width: width - 96 * s, useAdvancedWrap: true },
    });
    this.hint = this.add.text(width - 40 * s, height - 34 * s, '▼', {
      fontFamily: 'sans-serif', fontSize: `${12 * s}px`, color: '#8a84a0',
    }).setOrigin(1, 0.5).setVisible(false);
    this.tweens.add({ targets: this.hint, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this.choiceItems = [];
    this.busy = false;

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());

    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.step();
  }

  // 다음 노드 실행
  step() {
    const node = this.runner.next();
    if (node.end) {
      // 다음 이어하기 지점을 저장한다 (예: 프롤로그 끝 → 1장)
      if (node.next) WorldMemory.saveRun({ ...this.run, label: node.next, index: 0 });
      this.finish();
      return;
    }
    if (node.bg) { this.setPlace(node.bg); this.step(); return; }
    if (node.fx) { this.playFx(node.fx); this.time.delayedCall(fxDelay(node.fx), () => this.step()); return; }
    this.save();
    if (node.choice) { this.showChoice(node); return; }
    this.showLine(node);
  }

  save() {
    const run = { ...this.run, ...this.runner.lastPos };
    WorldMemory.saveRun(run);
  }

  setPlace(id) {
    const loc = locations[id];
    this.place.setText(loc.name);
    const c = Phaser.Display.Color.ValueToColor(loc.color);
    const gray = (c.red + c.green + c.blue) / 3;
    const mix = (v) => Math.round(v + (gray - v) * this.desat);
    this.bg.setFillStyle(Phaser.Display.Color.GetColor(mix(c.red), mix(c.green), mix(c.blue)));
  }

  showLine(node) {
    const who = node.who ? characters[node.who] : null;
    this.nameText.setText(who ? who.name : '').setColor(who?.color ?? '#ffffff');
    this.full = this.runner.format(node.say);
    this.shown = 0;
    this.bodyText.setText('').setColor(node.who ? '#ece8f4' : '#cfc9dd');
    this.hint.setVisible(false);
    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: 28, loop: true,
      callback: () => {
        this.shown += 1;
        this.bodyText.setText(this.full.slice(0, this.shown));
        if (this.shown >= this.full.length) this.doneTyping();
      },
    });
  }

  doneTyping() {
    this.typing?.remove();
    this.typing = null;
    this.bodyText.setText(this.full);
    this.hint.setVisible(true);
  }

  advance() {
    if (this.busy || this.choiceItems.length) return;
    if (this.typing) { this.doneTyping(); return; }
    this.step();
  }

  showChoice(node) {
    const { width, height } = this.scale;
    const s = this.s;
    const options = this.runner.options(node);
    this.nameText.setText('');
    this.bodyText.setText('');
    this.hint.setVisible(false);
    const top = height * 0.5 - (options.length * 52 * s) / 2;
    options.forEach((opt, i) => {
      const y = top + i * 52 * s;
      const r = this.add.rectangle(width / 2, y, 520 * s, 42 * s, 0x1c1928, 0.95)
        .setStrokeStyle(1, 0x5a5078).setInteractive({ useHandCursor: true });
      const t = this.add.text(width / 2, y, opt.text, {
        fontFamily: 'sans-serif', fontSize: `${17 * s}px`, color: '#ece8f4',
      }).setOrigin(0.5);
      r.on('pointerover', () => r.setStrokeStyle(2, 0xc9b8ff));
      r.on('pointerout', () => r.setStrokeStyle(1, 0x5a5078));
      r.on('pointerdown', (p, x, yy, e) => {
        e?.stopPropagation();
        this.clearChoice();
        this.runner.pick(opt);
        this.time.delayedCall(80, () => this.step());
      });
      this.choiceItems.push(r, t);
    });
  }

  clearChoice() {
    this.choiceItems.forEach((o) => o.destroy());
    this.choiceItems = [];
  }

  playFx(fx) {
    const cam = this.cameras.main;
    if (fx === 'shake') cam.shake(400, 0.008);
    if (fx === 'flash') cam.flash(500, 255, 255, 255);
    if (fx === 'fade') { cam.fadeOut(700, 0, 0, 0); this.time.delayedCall(900, () => cam.fadeIn(700, 0, 0, 0)); }
    if (fx === 'bell') cam.shake(250, 0.003);
    if (fx === 'glitch') {
      cam.shake(120, 0.02);
      this.tweens.add({ targets: this.bg, alpha: 0.2, duration: 60, yoyo: true, repeat: 3 });
    }
  }

  finish() {
    this.busy = true;
    this.cameras.main.fadeOut(1200, 0, 0, 0);
    this.time.delayedCall(1300, () => this.scene.start('Title'));
  }
}

function fxDelay(fx) {
  return { fade: 1800, flash: 500, shake: 450, bell: 700, glitch: 500 }[fx] ?? 300;
}
