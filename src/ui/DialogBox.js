// 하단 대화창. 중요한 장면에서 쓴다(평소 대사는 걸으며 듣는 말풍선이다).
// 말하는 인물에게 진짜 일러스트(content/cg.js의 PORTRAITS)가 있으면 대화창 오른쪽 뒤에 상반신이 서고,
// 없으면 대화창 안에 작은 도트 얼굴(팩의 Faceset)이 뜬다. 주인공·내레이션 차례에는 직전 일러스트가 어둡게 남는다.
// 한 글자씩 찍히고, 진행 키를 누르면 문장 완성 → 다음 문장. 생김새(색·테두리·글자)는 ui/kit.js에서 가져온다.
import Phaser from 'phaser';
import { COLORS, frame, text, scaleOf } from './kit.js';
import { PORTRAITS } from '../../content/cg.js';

export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = (this.s = scaleOf(scene));
    const w = (this.w = Math.min(720 * s, width - 40 * s)), h = (this.h = 100 * s);
    this.box = scene.add.container(width / 2, height - h / 2 - 16 * s).setVisible(false).setDepth(100);

    const bg = scene.add.graphics();
    frame(bg, -w / 2, -h / 2, w, h, s, { corners: 'diamond' });
    this.plate = scene.add.graphics();
    this.nameTag = text(scene, 0, -h / 2 - 1 * s, '', { size: 13, bold: true, color: COLORS.plateText }).setOrigin(0, 0.5);
    this.text = text(scene, -w / 2 + 24 * s, -h / 2 + 22 * s, '', {
      size: 15, lineSpacing: 7 * s, wordWrap: { width: w - 48 * s, useAdvancedWrap: true },
    });
    this.text.setShadow(0, 1 * s, '#1a100c', 0, false, true);
    // 작은 얼굴(팩의 Faceset 38×38을 정수배로)
    this.face = scene.add.image(-w / 2 + 20 * s, 2 * s, '__DEFAULT').setOrigin(0, 0.5).setVisible(false);
    this.faceW = 38 * Math.max(1, Math.round(1.6 * s));
    this.more = text(scene, w / 2 - 20 * s, h / 2 - 16 * s, '▼', { size: 11, color: COLORS.more }).setOrigin(1, 0.5);
    scene.tweens.add({ targets: this.more, y: this.more.y + 3 * s, alpha: 0.4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.box.add([bg, this.plate, this.face, this.nameTag, this.text, this.more]);
    this.resolve = null;

    // 일러스트: 발끝은 화면 밖, 얼굴은 대화창 위
    this.figureX = width / 2 + w / 2 - 150 * s;
    this.figureH = height * 0.8;
    this.figureY = height + 20 * s;
    this.figure = null; // 처음 세울 때 만든다
    this.figureOf = null;
  }

  // 이름표: 크림색 명패 + 왼쪽에 인물 색 띠
  drawPlate(x, color) {
    const s = this.s, g = this.plate;
    g.clear();
    const y = -this.h / 2 - 13 * s;
    const pw = this.nameTag.width + 26 * s, ph = 24 * s;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 1 * s, y + 3 * s, pw, ph, 5 * s);
    g.fillStyle(COLORS.plate, 1).fillRoundedRect(x, y, pw, ph, 5 * s);
    g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1).fillRoundedRect(x + 4 * s, y + 4 * s, 5 * s, ph - 8 * s, 2 * s);
    g.lineStyle(1.5 * s, COLORS.gold, 1).strokeRoundedRect(x, y, pw, ph, 5 * s);
    this.nameTag.setX(x + 14 * s);
  }

  hasPortrait(who) {
    return Boolean(who && PORTRAITS[who] && this.scene.textures.exists(`portrait.${who}`));
  }

  // 표정: 대사에 적힌 것 → 기본 얼굴
  figureKey(who, expr) {
    return expr && this.scene.textures.exists(`portrait.${who}.${expr}`) ? `portrait.${who}.${expr}` : `portrait.${who}`;
  }

  // 일러스트가 있으면 세운다. 없으면(주인공·내레이션 등) 직전 인물을 듣는 쪽으로 어둡게. 같은 인물이 CG로 떠 있으면 겹쳐 세우지 않는다
  showFigure(who, expr) {
    if (!this.hasPortrait(who) || this.scene.cg?.figure === who) {
      if (this.figure?.visible) this.figure.setTint(COLORS.listener);
      return false;
    }
    const key = this.figureKey(who, expr);
    this.figure ??= this.scene.add.image(this.figureX, this.figureY, key).setOrigin(0.5, 1).setDepth(99);
    this.figure.clearTint();
    if (this.figureOf === who && this.figure.visible) {
      // 같은 사람이 이어 말하면 표정만 바꾼다
      if (this.figure.texture.key !== key) this.figure.setTexture(key).setScale(this.figureH / this.figure.height);
      return true;
    }
    this.figureOf = who;
    this.figure.setTexture(key).setScale(this.figureH / this.figure.height).setVisible(true).setAlpha(0);
    this.figure.x = this.figureX + 24 * this.s;
    this.scene.tweens.add({ targets: this.figure, x: this.figureX, alpha: 1, duration: 260, ease: 'Cubic.easeOut' });
    return true;
  }

  get open() { return this.box.visible; }

  // faceId: 말하는 인물 id(도트 얼굴·일러스트를 고른다), expr: 표정
  say(name, color, str, faceId, expr) {
    this.box.setVisible(true);
    const s = this.s, w = this.w;
    const standing = this.showFigure(faceId, expr);
    const hasFace = !standing && Boolean(faceId) && this.scene.textures.exists(`face.${faceId}`);
    if (hasFace) this.face.setTexture(`face.${faceId}`).setDisplaySize(this.faceW, this.faceW);
    this.face.setVisible(hasFace);
    const left = -w / 2 + 24 * s + (hasFace ? this.faceW + 14 * s : 0);
    this.text.setX(left).setWordWrapWidth(w / 2 - 24 * s - left, true);
    this.nameTag.setText(name).setVisible(Boolean(name));
    if (name) this.drawPlate(-w / 2 + 14 * s, color);
    else this.plate.clear();
    this.text.setColor(name ? COLORS.text : COLORS.narration);
    this.full = str;
    this.shown = 0;
    this.text.setText('');
    this.more.setVisible(false);
    this.typer?.remove();
    this.typer = this.scene.time.addEvent({
      delay: 26, loop: true,
      callback: () => {
        this.shown += 1;
        this.text.setText(this.full.slice(0, this.shown));
        if (this.shown >= this.full.length) this.finishTyping();
      },
    });
    return new Promise((r) => { this.resolve = r; });
  }

  finishTyping() {
    this.typer?.remove();
    this.typer = null;
    this.text.setText(this.full);
    this.more.setVisible(true);
  }

  // 진행 입력. 처리했으면 true
  advance() {
    if (!this.open || !this.resolve) return false;
    if (this.typer) { this.finishTyping(); return true; }
    const r = this.resolve;
    this.resolve = null;
    r();
    return true;
  }

  close() {
    this.box.setVisible(false);
    this.typer?.remove();
    this.typer = null;
    this.figure?.setVisible(false);
    this.figureOf = null;
  }
}
