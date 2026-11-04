// 화면 가장자리 정보. PC 게임처럼 창 틀 안에 둔다(생김새는 ui/kit.js).
//   왼쪽 위:   장소·날짜·시각 명판 + 지금 할 일
//   오른쪽 아래: 키캡 안내 줄 (WASD 이동 · E 살펴보기 · I 가방 · J 수첩 · C 상태 · M 소리). 소리 키캡은 눌러도 바뀐다
//   인물 머리 위: 살펴볼 수 있을 때 E 키캡
import { COLORS, frame, text } from './kit.js';
import { Sound } from '../core/audio/Sound.js';

const KEYS = [['WASD', '이동'], ['E', '살펴보기'], ['I', '가방'], ['J', '수첩'], ['C', '상태'], ['+−', '지도'], ['M', '소리'], ['ESC', '메뉴']];

// 키캡 하나: 밝은 윗면 + 어두운 아랫단(눌리는 키처럼)
function keycap(scene, g, x, y, label, s) {
  const t = text(scene, 0, 0, label, { size: 10, color: COLORS.plateText });
  const w = Math.max(18 * s, t.width + 10 * s), h = 17 * s;
  g.fillStyle(0x8a6038, 1).fillRoundedRect(x, y + 2 * s, w, h, 3 * s);
  g.fillStyle(COLORS.plate, 1).fillRoundedRect(x, y, w, h, 3 * s);
  g.lineStyle(1 * s, COLORS.gold, 1).strokeRoundedRect(x, y, w, h, 3 * s);
  t.setPosition(x + w / 2, y + h / 2).setOrigin(0.5);
  return { t, w };
}

export class Hud {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = (this.s = width / 960);

    // 왼쪽 위 명판
    this.plateG = scene.add.graphics().setDepth(39);
    this.place = text(scene, 26 * s, 20 * s, '', { size: 13, bold: true, color: COLORS.accent }).setDepth(40);
    this.clock = text(scene, 0, 21 * s, '', { size: 11, color: COLORS.sub }).setDepth(40);
    this.objective = text(scene, 26 * s, 42 * s, '', { size: 11, color: COLORS.text }).setDepth(40);

    // 오른쪽 아래 키캡 줄
    this.controls = scene.add.container(0, 0).setDepth(40);
    this.drawKeys();
    this.unmute = Sound.onMuteChange(() => this.drawKeys());
    scene.events.once('shutdown', () => this.unmute?.());

    // 살펴보기 표시: 작은 E 키캡이 통통 뛴다
    this.prompt = scene.add.container(0, 0).setDepth(45).setVisible(false);
    const pg = scene.add.graphics();
    const { t, w } = keycap(scene, pg, 0, 0, 'E', s);
    pg.setPosition(-w / 2, -19 * s); t.setPosition(t.x - w / 2, t.y - 19 * s);
    this.prompt.add([pg, t]);
    scene.tweens.add({ targets: this.prompt, y: '-=2', duration: 400, yoyo: true, repeat: -1 });
    this.drawPlate();
  }

  drawKeys() {
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    this.controls.removeAll(true);
    const g = sc.add.graphics();
    this.controls.add(g);
    const items = KEYS.map(([k, label]) => [k, k === 'M' && Sound.muted ? '소리 꺼짐' : label]);
    // 오른쪽부터 거꾸로 채운다
    let x = width - 18 * s;
    const y = height - 30 * s;
    const parts = [];
    for (const [k, label] of [...items].reverse()) {
      const l = text(sc, 0, y + 8.5 * s, label, { size: 10, color: k === 'M' && Sound.muted ? COLORS.dim : COLORS.text }).setOrigin(1, 0.5);
      l.setShadow(1, 1, '#000', 0);
      l.x = x;
      x -= l.width + 5 * s;
      const probe = text(sc, 0, 0, k, { size: 10 });
      const w = Math.max(18 * s, probe.width + 10 * s);
      probe.destroy();
      x -= w;
      parts.push({ k, l, kx: x });
      x -= 14 * s;
    }
    // 뒤 바탕: 반투명 띠
    const left = x + 6 * s;
    g.fillStyle(COLORS.body, 0.72).fillRoundedRect(left, y - 7 * s, width - 8 * s - left, 32 * s, 6 * s);
    g.lineStyle(1 * s, COLORS.inner, 1).strokeRoundedRect(left, y - 7 * s, width - 8 * s - left, 32 * s, 6 * s);
    for (const { k, l, kx } of parts) {
      const { t } = keycap(sc, g, kx, y, k, s);
      this.controls.add([t, l]);
      if (k === 'M') {
        // 소리 키캡은 마우스로도 누른다
        for (const o of [t, l]) o.setInteractive({ useHandCursor: true }).on('pointerdown', (p, lx, ly, e) => { e?.stopPropagation(); Sound.toggleMute(); });
      }
    }
  }

  // 명판 틀을 글자 길이에 맞춰 다시 그린다
  drawPlate() {
    const s = this.s, g = this.plateG;
    this.clock.setX(this.place.x + this.place.width + 10 * s);
    const w = Math.max(this.place.width + (this.clockText ? this.clock.width + 10 * s : 0), this.objective.text ? this.objective.width : 0) + 32 * s;
    const h = (this.objective.text ? 52 : 32) * s;
    g.clear();
    if (!this.place.text && !this.objective.text) return;
    frame(g, 10 * s, 10 * s, w, h, s, { corners: 'diamond', radius: 6, sheen: false, alpha: 0.88 });
  }

  // 장소 이름 옆에 게임 안 시계를 붙인다 (시계가 도는 날에만): '우리 마을  4일째 21:00'
  setPlace(str) { this.place.setText(str ?? ''); this.drawPlate(); }
  setClock(str) { if (this.clockText !== (str ?? '')) { this.clockText = str ?? ''; this.clock.setText(this.clockText); this.drawPlate(); } }
  setObjective(str) { this.objective.setText(str ? `◆ ${str}` : ''); this.drawPlate(); }
  hideControls() { this.scene.tweens.add({ targets: this.controls, alpha: 0.35, duration: 800 }); }
  hideKeys() { this.controls.setVisible(false); }

  showPrompt(p) {
    if (!p) { this.prompt.setVisible(false); return; }
    this.prompt.setVisible(true);
    this.prompt.x = p.x;
    if (!this.promptY || Math.abs(this.promptY - p.y) > 4) this.prompt.y = p.y;
    this.promptY = p.y;
  }

  setVisible(v) { [this.plateG, this.place, this.clock, this.objective, this.controls].forEach((o) => o.setVisible(v)); if (!v) this.prompt.setVisible(false); }
}
