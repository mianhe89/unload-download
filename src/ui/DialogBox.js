// 하단 대화창. 중요한 장면과 말 걸기 대화에서 쓴다(평소 대사는 걸으며 듣는 말풍선이다).
// 흰 종이 같은 창 + 금 테두리 + 인물 색 이름표. 열릴 때 살짝 튀어 오른다.
// 말하는 인물에게 진짜 일러스트(content/cg.js의 PORTRAITS)가 있으면 대화창 오른쪽 뒤에 상반신이 서고,
// 없으면 대화창 안에 작은 도트 얼굴(팩의 Faceset)이 뜬다. 주인공·내레이션 차례에는 직전 일러스트가 어둡게 남는다.
// 호감도 단계 그림(PORTRAITS.<인물>.stages)이 있으면 단계에 맞는 그림을 고른다(src/ui/portraits.js).
// 글자는 한 글자씩 '도도도' 소리와 함께 찍히고(src/core/audio/Voice.js), 꾸밈 문법을 쓸 수 있다(src/ui/rich.js).
// 진행 키: 찍는 중이면 문장 완성 → 다음 문장.
import Phaser from 'phaser';
import { COLORS, text, scaleOf } from './kit.js';
import { FONT_TALK } from '../config/game.js';
import { PORTRAITS } from '../../content/cg.js';
import { RichText } from './RichText.js';
import { plain } from './rich.js';
import { voiceOf, blip } from '../core/audio/Voice.js';
import { portraitKey } from './portraits.js';
import { WorldMemory } from '../core/world/WorldMemory.js';

// 흰 대화창의 색 (금 테두리는 kit.js와 같은 금색)
const PAPER = { body: 0xfffbf2, inner: 0xeadfc8, ink: '#2e2620', narration: '#6a5a4a', shadow: 0x1a100c };
const hex = (c) => Phaser.Display.Color.HexStringToColor(c).color;
// 이름표 바탕: 인물 색을 조금 진하게 (흰 글자가 읽히게)
const deepen = (c, k = 0.6) => {
  const n = hex(c);
  return (Math.round(((n >> 16) & 255) * k) << 16) | (Math.round(((n >> 8) & 255) * k) << 8) | Math.round((n & 255) * k);
};

export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = (this.s = scaleOf(scene));
    const w = (this.w = Math.min(740 * s, width - 40 * s)), h = (this.h = 112 * s);
    this.y0 = height - h / 2 - 16 * s;
    this.box = scene.add.container(width / 2, this.y0).setVisible(false).setDepth(100);

    const bg = scene.add.graphics();
    const r = 12 * s;
    bg.fillStyle(PAPER.shadow, 0.35).fillRoundedRect(-w / 2 + 3 * s, -h / 2 + 6 * s, w, h, r);
    bg.fillStyle(PAPER.body, 0.98).fillRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.fillStyle(0xffffff, 0.6).fillRoundedRect(-w / 2 + 4 * s, -h / 2 + 4 * s, w - 8 * s, h * 0.35, r * 0.8);
    bg.lineStyle(3 * s, COLORS.gold, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    bg.lineStyle(1 * s, PAPER.inner, 1).strokeRoundedRect(-w / 2 + 6 * s, -h / 2 + 6 * s, w - 12 * s, h - 12 * s, r * 0.6);
    for (const [cx, cy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
      const d = 4.5 * s;
      bg.fillStyle(COLORS.goldLight, 1).fillTriangle(cx, cy - d, cx + d, cy, cx, cy + d).fillTriangle(cx, cy - d, cx - d, cy, cx, cy + d);
      bg.fillStyle(COLORS.inner, 1).fillCircle(cx, cy, 1.3 * s);
    }
    this.plate = scene.add.graphics();
    this.nameTag = text(scene, 0, -h / 2 - 1 * s, '', { size: 13, bold: true, color: '#ffffff' }).setOrigin(0, 0.5);
    this.nameTag.setShadow(1 * s, 1 * s, '#000000', 0, false, true);
    this.text = new RichText(scene, -w / 2 + 24 * s, 0, { font: FONT_TALK, size: 15 * s, color: PAPER.ink, lineHeight: 1.75 });
    // 작은 얼굴 카드 (일러스트가 없을 때)
    this.faceCard = scene.add.graphics();
    this.faceW = 38 * Math.max(1, Math.round(1.9 * s));
    this.face = scene.add.image(-w / 2 + 22 * s + this.faceW / 2, 0, '__DEFAULT').setVisible(false);
    // 다음 표시: 통통 튀는 금색 삼각형
    this.more = scene.add.triangle(w / 2 - 22 * s, h / 2 - 18 * s, 0, 0, 10 * s, 0, 5 * s, 7 * s, COLORS.gold).setVisible(false);
    scene.tweens.add({ targets: this.more, y: this.more.y + 3 * s, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.box.add([bg, this.faceCard, this.face, this.plate, this.nameTag, this.text.container, this.more]);
    this.resolve = null;
    this.speaker = undefined;
    scene.events.on('update', (t) => this.text.update(t));

    // 일러스트: 발끝은 화면 밖, 얼굴은 대화창 위
    this.figureX = width / 2 + w / 2 - 150 * s;
    this.figureH = height * 0.8;
    this.figureY = height + 20 * s;
    this.figure = null; // 처음 세울 때 만든다
    this.figureOf = null;
  }

  // 이름표: 인물 색(진하게) 둥근 명패 + 금 테
  drawPlate(x, color) {
    const s = this.s, g = this.plate;
    g.clear();
    const y = -this.h / 2 - 13 * s;
    const pw = this.nameTag.width + 28 * s, ph = 24 * s;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 1 * s, y + 3 * s, pw, ph, ph / 2);
    g.fillStyle(deepen(color), 1).fillRoundedRect(x, y, pw, ph, ph / 2);
    g.fillStyle(0xffffff, 0.22).fillRoundedRect(x + 5 * s, y + 3 * s, pw - 10 * s, 5 * s, 3 * s);
    g.lineStyle(1.5 * s, COLORS.gold, 1).strokeRoundedRect(x, y, pw, ph, ph / 2);
    this.nameTag.setX(x + 14 * s);
  }

  // 표정·호감도 단계 → 텍스처 키 (없으면 null)
  figureKey(who, expr) {
    if (!who || !PORTRAITS[who]) return null;
    return portraitKey(who, { mood: expr, affinity: WorldMemory.run?.affinity?.[who] ?? 0 }, (k) => this.scene.textures.exists(k));
  }

  // 일러스트가 있으면 세운다. 없으면(주인공·내레이션 등) 직전 인물을 듣는 쪽으로 어둡게. 같은 인물이 CG로 떠 있으면 겹쳐 세우지 않는다
  showFigure(who, expr) {
    const key = this.figureKey(who, expr);
    if (!key || this.scene.cg?.figure === who) {
      if (this.figure?.visible) this.figure.setTint(COLORS.listener);
      return false;
    }
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

  // 열기 연출: 아래에서 살짝 올라오며 나타난다
  show() {
    this.scene.tweens.killTweensOf(this.box);
    if (this.box.visible) { this.box.setAlpha(1).setY(this.y0).setScale(1); return; }
    this.box.setVisible(true).setAlpha(0).setY(this.y0 + 14 * this.s).setScale(0.97);
    this.scene.tweens.add({ targets: this.box, alpha: 1, y: this.y0, scale: 1, duration: 180, ease: 'Back.out' });
  }

  // faceId: 말하는 인물 id(도트 얼굴·일러스트·목소리를 고른다), expr: 표정 (대사 맨 앞의 [mood=..]도 된다)
  say(name, color, str, faceId, expr) {
    this.show();
    const s = this.s, w = this.w, h = this.h;
    const mood = expr ?? /^\[mood=([\w-]+)\]/.exec(str)?.[1] ?? null;
    const changed = this.speaker !== faceId;
    this.speaker = faceId;
    const standing = this.showFigure(faceId, mood);
    const hasFace = !standing && Boolean(faceId) && this.scene.textures.exists(`face.${faceId}`);
    const fw = this.faceW;
    this.faceCard.clear();
    if (hasFace) {
      const fx = -w / 2 + 22 * s, fy = -fw / 2;
      this.faceCard.fillStyle(COLORS.gold, 1).fillRoundedRect(fx - 2 * s, fy - 2 * s, fw + 4 * s, fw + 4 * s, 8 * s);
      this.faceCard.fillStyle(0xffffff, 1).fillRoundedRect(fx, fy, fw, fw, 6 * s);
      this.faceCard.fillStyle(hex(color), 0.4).fillRoundedRect(fx, fy, fw, fw, 6 * s);
      const k = Math.max(1, Math.floor(fw / 38));
      this.face.setTexture(`face.${faceId}`).setScale(k).setVisible(true);
      if (changed) { this.face.setScale(k * 0.8); this.scene.tweens.add({ targets: this.face, scale: k, duration: 160, ease: 'Back.out' }); }
    } else this.face.setVisible(false);
    const left = -w / 2 + 26 * s + (hasFace ? fw + 16 * s : 0);
    const right = w / 2 - 26 * s - (standing ? 120 * s : 0);
    this.nameTag.setText(name).setVisible(Boolean(name));
    if (name) {
      this.drawPlate(-w / 2 + 16 * s, color);
      if (changed) { this.nameTag.setAlpha(0); this.scene.tweens.add({ targets: this.nameTag, alpha: 1, duration: 160 }); }
    } else this.plate.clear();
    this.full = plain(str);
    this.text.o.color = name ? PAPER.ink : PAPER.narration;
    const info = this.text.set(str, right - left);
    this.text.container.setPosition(left, -h / 2 + (h - info.height) / 2 - 2 * s);
    this.more.setVisible(false);
    const voice = voiceOf(faceId ?? 'narrator');
    this.text.type({
      speed: name ? voice.speed : 32,
      onChar: name ? (g, i) => blip(this.scene, voice, g.ch, i) : null,
    }).then(() => { if (this.text.done && this.resolve) this.more.setVisible(true); });
    return new Promise((r) => { this.resolve = r; });
  }

  // 진행 입력. 처리했으면 true
  advance() {
    if (!this.open || !this.resolve) return false;
    if (this.text.typing) { this.text.skip(); this.more.setVisible(true); return true; }
    const r = this.resolve;
    this.resolve = null;
    r();
    return true;
  }

  close() {
    this.text.stopTyping();
    this.box.setVisible(false);
    this.speaker = undefined;
    this.figure?.setVisible(false);
    this.figureOf = null;
  }
}
