// 인물 머리 위 말풍선. 월드 좌표를 따라다니지만 UI 씬에서 그려 글자가 선명하다.
// 흰 둥근 풍선 + 화자 쪽 꼬리 + 화자 색 띠. 톡 튀어나오고, 글자는 '도도도' 소리와 함께 찍힌다.
import { FONT } from '../config/game.js';
import { RichText } from './RichText.js';
import { voiceOf, blip } from '../core/audio/Voice.js';

const EDGE = 0x2a2533;
const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);

export class SpeechBubbles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.s = scene.scale.width / 960;
  }

  // target: { x, y, id } 를 가진 월드 객체
  // opts.faint: 멀어서 잘 들리지 않는 말 (흐리게, 소리 없음)
  show(target, text, color = '#ffffff', ms = 2600, opts = {}) {
    this.list.filter((b) => b.target === target && b.kind === 'say').forEach((b) => this.remove(b));
    const s = this.s, sc = this.scene;
    const c = sc.add.container(0, 0).setDepth(50);
    const rt = new RichText(sc, 0, 0, { font: FONT, size: 12 * s, color: '#2a2533', lineHeight: 1.6 });
    const info = rt.set(text, 200 * s);
    const padX = 9 * s, padY = 5 * s;
    const w = Math.max(info.width, 14 * s) + padX * 2, h = info.height + padY * 2;
    const g = sc.add.graphics();
    const r = Math.min(9 * s, h / 2);
    const tail = 6 * s;
    // 그림자 → 테두리 → 흰 바탕 → 화자 색 띠 → 꼬리
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-w / 2 + 1 * s, -h - tail + 3 * s, w, h, r);
    g.fillStyle(EDGE, 1).fillRoundedRect(-w / 2 - 2 * s, -h - tail - 2 * s, w + 4 * s, h + 4 * s, r + 2 * s);
    g.fillTriangle(-tail - 2 * s, -tail - 1 * s, tail + 2 * s, -tail - 1 * s, 0, 2 * s);
    g.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h - tail, w, h, r);
    g.fillTriangle(-tail, -tail - 1 * s, tail, -tail - 1 * s, 0, -1 * s);
    g.fillStyle(hex(color), 1).fillRect(-w / 2 + r, -h - tail, w - r * 2, 2 * s);
    rt.container.setPosition(-info.width / 2, -h - tail + padY - 1 * s);
    c.add([g, rt.container]);
    if (opts.faint) c.setAlpha(0.5);
    // 톡 튀어나오기
    c.setScale(0.4);
    sc.tweens.add({ targets: c, scale: 1, duration: 170, ease: 'Back.out' });
    const voice = voiceOf(target.id ?? 'narrator');
    rt.type({ speed: Math.max(18, voice.speed - 8), onChar: opts.faint ? null : (gl, i) => blip(sc, voice, gl.ch, i, 0.03) });
    const b = { target, c, rt, until: sc.time.now + ms, kind: 'say', dy: -18, rise: 0 };
    this.list.push(b);
    return b;
  }

  // 내레이션: 말풍선 없이 인물 위 허공에 떠오르는 글. 천천히 올라가며 흐려진다
  narrate(target, text, ms = 3000) {
    this.list.filter((b) => b.target === target && b.kind === 'narr').forEach((b) => this.remove(b));
    const s = this.s, sc = this.scene;
    const c = sc.add.container(0, 0).setDepth(49).setAlpha(0);
    const rt = new RichText(sc, 0, 0, { font: FONT, size: 12 * s, color: '#efe8fa', lineHeight: 1.6, shadow: '#000000', dark: true });
    const info = rt.set(text, 300 * s);
    rt.container.setPosition(-info.width / 2, -info.height);
    rt.reveal(Infinity);
    c.add(rt.container);
    sc.tweens.add({ targets: c, alpha: 0.95, duration: 300 });
    const now = sc.time.now;
    const b = { target, c, rt, until: now + ms, kind: 'narr', dy: -30, born: now, rise: 10 };
    this.list.push(b);
    return b;
  }

  remove(b) { b.rt.destroy(); b.c.destroy(); this.list = this.list.filter((x) => x !== b); }

  update(toScreen) {
    const now = this.scene.time.now;
    for (const b of [...this.list]) {
      if (now > b.until || !b.target.sprite?.active) { this.remove(b); continue; }
      const life = b.rise ? (now - b.born) / (b.until - b.born) : 0;
      const p = toScreen(b.target.x, b.target.y + b.dy - life * b.rise);
      b.c.setPosition(Math.round(p.x), Math.round(p.y));
      b.rt.update(now);
      if (b.rise && life > 0.8) b.c.setAlpha(0.95 * (1 - life) / 0.2);
    }
  }

  clear() { [...this.list].forEach((b) => this.remove(b)); }
}
