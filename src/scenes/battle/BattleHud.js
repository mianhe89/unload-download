// 전투 HUD (전투 장면 부품): 화면 좌표. 필드 창과 같은 밤색 + 금 테두리(src/ui/kit.js).
//   위: 보스면 이름 띠와 큰 체력 막대(성나는 지점 눈금), 아니면 '남은 적' 명패
//   아래 왼쪽: 내 얼굴 메달, 체력 막대(늦게 따라오는 흰 막대·회복 중 초록 띠·10% 눈금), 상태이상 알약
//   아래 가운데: 스킬 칸 다섯(그림·키캡·이름, 둥근 재사용 시계, 다 차면 번쩍)
//   아래 오른쪽: 퀵슬롯 1~8(아이템 그림·개수·등급 색)
//   오른쪽 가운데: 연타 수. 가운데 아래: 알림 줄. 체력이 낮으면 화면 가장자리가 붉게 뛴다
import { FONT, FONT_TALK } from '../../config/game.js';
import { CONTROLS, STATUS, CONSUMABLES } from '../../../content/action/action.js';
import { FOES } from '../../../content/action/foes.js';
import { RARITY } from '../../../content/items/items.js';
import { COLORS } from '../../ui/kit.js';

const KEYS = ['atk', 'q', 'w', 'e', 'r'];
const KEY_LABEL = { atk: '클릭', ...CONTROLS.skills };
const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);
const COMBO_GAP = 1.6; // 이 초 안에 다시 맞히면 연타가 이어진다

export class BattleHud {
  constructor(scene, { bossId, skin }) {
    this.scene = scene;
    this.s = scene.s;
    this.bossId = bossId;
    this.skin = skin;
    this.combo = 0;
    this.comboLeft = 0;
    this.build();
  }

  T(x, y, str, size, color, o = {}) {
    return this.scene.add.text(x, y, str, { fontFamily: o.font ?? FONT, fontStyle: o.bold ? 'bold' : '', fontSize: `${size * this.s}px`, color }).setStroke('#120c10', (o.stroke ?? 3) * this.s);
  }

  // 금테 판 (밤색 바탕)
  plate(g, x, y, w, h, r = 8, alpha = 0.88) {
    const s = this.s;
    g.fillStyle(0x000000, 0.35).fillRoundedRect(x + 2 * s, y + 3 * s, w, h, r * s);
    g.fillStyle(COLORS.body, alpha).fillRoundedRect(x, y, w, h, r * s);
    g.fillStyle(0xffe6b8, 0.06).fillRoundedRect(x + 2 * s, y + 2 * s, w - 4 * s, h * 0.42, r * 0.8 * s);
    g.lineStyle(2 * s, COLORS.gold, 1).strokeRoundedRect(x, y, w, h, r * s);
  }

  build() {
    const sc = this.scene, s = this.s;
    const { width: W, height: H } = sc.scale;
    // 아래 띠: 위로 갈수록 옅어지는 그늘
    const band = sc.add.graphics();
    for (let i = 0; i < 12; i += 1) band.fillStyle(0x0b0810, 0.07).fillRect(0, H - (78 - i * 4) * s, W, (78 - i * 4) * s);
    this.g = sc.add.graphics(); // 틀 (한 번 그림)
    this.dyn = sc.add.graphics(); // 막대·시계 (매 프레임)

    // ── 위: 보스 / 남은 적 ──
    if (this.bossId) {
      const bw = 470 * s, bx = W / 2 - bw / 2, by = 26 * s;
      this.plate(this.g, bx - 10 * s, 6 * s, bw + 20 * s, 34 * s, 8);
      this.boss = { bw, bx, by };
      const name = this.T(W / 2, 8 * s, FOES[this.bossId].name, 13, '#f4e6ff', { bold: true, font: FONT_TALK, stroke: 4 }).setOrigin(0.5, 0.5);
      // 이름 뒤 금 명패
      const tw = name.width + 28 * s;
      this.g.fillStyle(COLORS.gold, 1).fillRoundedRect(W / 2 - tw / 2, -1 * s, tw, 18 * s, 6 * s);
      this.g.fillStyle(0x3a2418, 1).fillRoundedRect(W / 2 - tw / 2 + 2 * s, 1 * s, tw - 4 * s, 14 * s, 5 * s);
      name.setDepth(1);
      this.bossStatus = this.T(bx + bw, 44 * s, '', 10, '#ffb0b0').setOrigin(1, 0);
      this.bossLag = 1;
    } else {
      this.countPlate = sc.add.graphics();
      this.countText = this.T(W / 2, 16 * s, '', 12, '#fff4e2', { bold: true }).setOrigin(0.5);
    }

    // ── 아래 왼쪽: 나 ──
    const py = H - 38 * s;
    this.plate(this.g, 12 * s, py - 26 * s, 290 * s, 52 * s, 10);
    // 얼굴 메달
    this.g.fillStyle(0xf8ecd2, 1).fillCircle(40 * s, py, 20 * s);
    this.g.lineStyle(2.5 * s, COLORS.gold, 1).strokeCircle(40 * s, py, 20 * s);
    const key = `char.${this.skin}`;
    if (sc.textures.exists(key)) {
      const face = sc.add.image(40 * s, py + 6 * s, key, 0).setScale(2.3 * s);
      const mask = sc.make.graphics({ add: false }).fillCircle(40 * s, py, 18.5 * s);
      face.setMask(mask.createGeometryMask());
    }
    this.T(68 * s, py - 22 * s, '나', 11, COLORS.accent, { bold: true });
    this.hp = { x: 68 * s, y: py - 6 * s, w: 222 * s, h: 12 * s, lag: 1 };
    this.hpText = this.T(290 * s, py - 21 * s, '', 10, '#fff4e2', { bold: true }).setOrigin(1, 0);
    this.chips = sc.add.container(0, 0);
    this.chipY = py + 12 * s;

    // ── 아래 가운데: 스킬 ──
    const SZ = 50 * s;
    this.slots = KEYS.map((k, i) => {
      const x = 334 * s + i * 60 * s, y = H - 40 * s;
      this.plate(this.g, x - SZ / 2, y - SZ / 2, SZ, SZ, 8, 0.95);
      const icon = sc.add.graphics();
      const name = this.T(x, y + SZ / 2 + 1 * s, '', 9, '#fff4e2').setOrigin(0.5, 0);
      // 키캡: 밝은 명패
      const lab = KEY_LABEL[k];
      const kw = (lab.length > 1 ? 26 : 14) * s;
      this.g.fillStyle(0xf8ecd2, 1).fillRoundedRect(x - SZ / 2 - 3 * s, y - SZ / 2 - 5 * s, kw, 13 * s, 3 * s);
      this.g.fillStyle(0xc8a878, 1).fillRect(x - SZ / 2 - 3 * s, y - SZ / 2 + 6 * s, kw, 2 * s);
      this.T(x - SZ / 2 - 3 * s + kw / 2, y - SZ / 2 + 1.5 * s, lab, 8, COLORS.plateText, { bold: true, stroke: 0 }).setOrigin(0.5);
      const sec = this.T(x, y, '', 13, '#ffffff', { bold: true }).setOrigin(0.5);
      return { k, x, y, icon, name, sec, ready: true };
    });

    // ── 아래 오른쪽: 퀵슬롯 ──
    this.qslots = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const x = W - 34 * s - (7 - i) * 40 * s, y = H - 40 * s;
      const id = this.scene.quick[i];
      const r = id ? RARITY[CONSUMABLES[id]?.rarity ?? 'common'] : null;
      this.g.fillStyle(0x000000, 0.3).fillRoundedRect(x - 17 * s + 2 * s, y - 21 * s + 3 * s, 34 * s, 42 * s, 6 * s);
      this.g.fillStyle(0x1e1620, 0.95).fillRoundedRect(x - 17 * s, y - 21 * s, 34 * s, 42 * s, 6 * s);
      this.g.lineStyle(1.5 * s, r ? hex(r.glow) : 0x4a3a3a, r ? 0.9 : 0.6).strokeRoundedRect(x - 17 * s, y - 21 * s, 34 * s, 42 * s, 6 * s);
      if (r) this.g.fillStyle(hex(r.glow), 0.12).fillRoundedRect(x - 15 * s, y - 19 * s, 30 * s, 38 * s, 5 * s);
      this.T(x - 13 * s, y - 20 * s, String(i + 1), 8, COLORS.accent, { bold: true });
      const icon = id && sc.textures.exists(`icon.${id}`) ? sc.add.image(x, y - 1 * s, `icon.${id}`).setScale(1.6 * s) : null;
      const cnt = this.T(x + 14 * s, y + 20 * s, '', 10, '#ffffff', { bold: true }).setOrigin(1, 1);
      return { id, x, y, icon, cnt };
    });

    // 연타
    this.comboText = this.T(W - 28 * s, 120 * s, '', 22, '#ffd27a', { bold: true, stroke: 5 }).setOrigin(1, 0.5).setAlpha(0);
    this.comboSub = this.T(W - 28 * s, 140 * s, '연타', 10, '#f4e6d0').setOrigin(1, 0.5).setAlpha(0);

    // 알림 줄
    this.msgBg = sc.add.graphics().setAlpha(0);
    this.msg = this.T(W / 2, H - 106 * s, '', 13, '#ffffff', { font: FONT_TALK }).setOrigin(0.5);

    // 체력이 낮을 때 붉은 가장자리
    const vk = 'battle.lowhp';
    if (!sc.textures.exists(vk)) {
      const tex = sc.textures.createCanvas(vk, 256, 144);
      const ctx = tex.getContext();
      const grd = ctx.createRadialGradient(128, 72, 50, 128, 72, 150);
      grd.addColorStop(0, 'rgba(200,20,30,0)');
      grd.addColorStop(1, 'rgba(200,20,30,0.75)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 144);
      tex.refresh();
    }
    this.lowhp = sc.add.image(W / 2, H / 2, vk).setDisplaySize(W, H).setAlpha(0).setDepth(30);
  }

  // 스킬 모양에 맞는 작은 그림
  drawIcon(g, shape, key, x, y, on) {
    const s = this.s, c = on ? 0xfff4e2 : 0x8a7a6a, a = COLORS.gold;
    g.clear();
    g.lineStyle(2.5 * s, c, 1);
    if (shape === 'arc' && key === 'atk') {
      g.beginPath().arc(x - 2 * s, y + 4 * s, 12 * s, -2.4, -0.6).strokePath();
      g.lineStyle(2 * s, a, 1).lineBetween(x + 6 * s, y - 8 * s, x - 4 * s, y + 4 * s);
    } else if (shape === 'arc') {
      g.beginPath().arc(x, y, 10 * s, -2.6, 2.0).strokePath();
      g.fillStyle(c, 1).fillTriangle(x + 4 * s, y + 9 * s, x - 3 * s, y + 12 * s, x - 1 * s, y + 5 * s);
    } else if (shape === 'line') {
      g.lineBetween(x - 10 * s, y + 8 * s, x + 7 * s, y - 7 * s);
      g.fillStyle(c, 1).fillTriangle(x + 11 * s, y - 11 * s, x + 2 * s, y - 8 * s, x + 8 * s, y - 2 * s);
    } else if (shape === 'guard') {
      g.beginPath().moveTo(x - 9 * s, y - 9 * s).lineTo(x + 9 * s, y - 9 * s).lineTo(x + 8 * s, y + 2 * s).lineTo(x, y + 11 * s).lineTo(x - 8 * s, y + 2 * s).closePath().strokePath();
      g.lineStyle(1.5 * s, a, 1).lineBetween(x, y - 6 * s, x, y + 6 * s);
    } else if (shape === 'dash') {
      for (const d of [-6, 3]) g.beginPath().moveTo(x + (d - 4) * s, y - 8 * s).lineTo(x + (d + 4) * s, y).lineTo(x + (d - 4) * s, y + 8 * s).strokePath();
    } else g.strokeCircle(x, y, 8 * s);
  }

  // 맞히면 연타가 이어진다
  hit() {
    this.combo = this.comboLeft > 0 ? this.combo + 1 : 1;
    this.comboLeft = COMBO_GAP;
    if (this.combo < 3) return;
    this.comboText.setText(String(this.combo)).setAlpha(1).setScale(1.35);
    this.comboSub.setAlpha(1);
    this.scene.tweens.add({ targets: this.comboText, scale: 1, duration: 140, ease: 'Back.out' });
    this.comboText.setColor(this.combo >= 20 ? '#ff8a5a' : this.combo >= 10 ? '#ffbf47' : '#ffd27a');
  }

  message(str, color = '#ffffff') {
    const s = this.s, { width: W, height: H } = this.scene.scale;
    this.msg.setText(str).setColor(color).setAlpha(1);
    const w = this.msg.width + 36 * s;
    this.msgBg.clear().fillStyle(0x0b0810, 0.72).fillRoundedRect(W / 2 - w / 2, H - 118 * s, w, 24 * s, 12 * s).setAlpha(1);
    this.scene.tweens.killTweensOf([this.msg, this.msgBg]);
    this.scene.tweens.add({ targets: [this.msg, this.msgBg], alpha: 0, delay: 1300, duration: 400 });
  }

  // 끝 띠: 이겼다/쓰러졌다. 화면을 가로지르는 띠에 큰 글자, 아래 한 줄
  banner(title, sub, color = '#ffd27a') {
    const sc = this.scene, s = this.s, { width: W, height: H } = sc.scale;
    const y = H * 0.3;
    const g = sc.add.graphics().setDepth(55).setY(y);
    g.fillStyle(0x0b0810, 0.78).fillRect(0, -34 * s, W, 68 * s);
    g.fillStyle(hex(color), 0.9).fillRect(0, -34 * s, W, 2 * s).fillRect(0, 32 * s, W, 2 * s);
    const t = this.T(W / 2, y - 6 * s, title, 26, color, { bold: true, font: FONT_TALK, stroke: 5 }).setOrigin(0.5).setDepth(56).setScale(1.6).setAlpha(0);
    const u = sub ? this.T(W / 2, y + 20 * s, sub, 12, '#f4e6d0', { font: FONT_TALK }).setOrigin(0.5).setDepth(56).setAlpha(0) : null;
    g.setScale(1, 0);
    sc.tweens.add({ targets: g, scaleY: 1, duration: 200, ease: 'Cubic.out' });
    sc.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, delay: 80, ease: 'Back.out' });
    if (u) sc.tweens.add({ targets: u, alpha: 1, duration: 300, delay: 260 });
  }

  bar(g, x, y, w, h, frac, lagFrac, color, { ticks = 10, regen = 0 } = {}) {
    const s = this.s;
    g.fillStyle(0x120c10, 0.9).fillRoundedRect(x - 2 * s, y - 2 * s, w + 4 * s, h + 4 * s, (h / 2 + 2) );
    g.fillStyle(0x3a2a2a, 1).fillRoundedRect(x, y, w, h, h / 2);
    if (lagFrac > frac) g.fillStyle(0xfff4e2, 0.85).fillRoundedRect(x, y, Math.max(h, w * lagFrac), h, h / 2);
    if (frac > 0) {
      g.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(h, w * frac), h, h / 2);
      g.fillStyle(0xffffff, 0.25).fillRoundedRect(x + 2 * s, y + 1 * s, Math.max(0, w * frac - 4 * s), h * 0.35, h * 0.2);
    }
    if (regen > 0) g.fillStyle(0x9affb0, 0.9).fillRect(x, y + h - 2 * s, w * Math.min(1, regen), 2 * s);
    g.fillStyle(0x120c10, 0.45);
    for (let i = 1; i < ticks; i += 1) g.fillRect(x + (w * i) / ticks - 0.5 * s, y + 1 * s, 1 * s, h - 2 * s);
  }

  refresh(st, dt, first = false) {
    const s = this.s, p = st.p, g = this.dyn.clear();
    const { width: W } = this.scene.scale;
    // 보스
    if (this.boss) {
      const b = st.foes.find((f) => f.id === this.bossId);
      const frac = Math.max(0, (b?.hp ?? 0) / (b?.maxHp ?? 1));
      this.bossLag += (frac - this.bossLag) * Math.min(1, dt * 3);
      const enraged = FOES[this.bossId].enrageAt && frac < FOES[this.bossId].enrageAt;
      this.bar(g, this.boss.bx, this.boss.by - 4 * s, this.boss.bw, 10 * s, frac, this.bossLag, enraged ? 0xe0405a : 0xb04aff, { ticks: 20 });
      const ea = FOES[this.bossId].enrageAt;
      if (ea) {
        const ex = this.boss.bx + this.boss.bw * ea;
        g.fillStyle(COLORS.goldLight, 1).fillTriangle(ex - 4 * s, this.boss.by - 10 * s, ex + 4 * s, this.boss.by - 10 * s, ex, this.boss.by - 4 * s);
      }
      this.bossStatus.setText(Object.keys(b?.status ?? {}).map((id) => STATUS[id].name).join(' '));
    } else {
      const left = st.foes.filter((f) => f.hp > 0).length + st.queue.length;
      const txt = st.total > 1 ? `남은 적  ${left}` : '';
      if (txt !== this.countText.text) {
        this.countText.setText(txt);
        this.countPlate.clear();
        if (txt) {
          const w = this.countText.width + 34 * s;
          this.plate(this.countPlate, W / 2 - w / 2, 4 * s, w, 24 * s, 12);
          this.countPlate.fillStyle(0xe05a4a, 1).fillCircle(W / 2 - w / 2 + 12 * s, 16 * s, 3.5 * s);
          if (!first) this.scene.tweens.add({ targets: this.countText, scale: { from: 1.3, to: 1 }, duration: 160 });
        }
      }
    }
    // 내 체력
    const frac = p.hp / p.maxHp;
    this.hp.lag += (frac - this.hp.lag) * Math.min(1, dt * 3);
    const col = frac < 0.3 ? 0xe04a4a : p.status.poison ? 0x8ad04a : 0x5ad06a;
    this.bar(g, this.hp.x, this.hp.y, this.hp.w, this.hp.h, frac, this.hp.lag, col, { regen: p.regen ? p.regen.left / 8 : 0 });
    this.hpText.setText(`${p.hp} / ${p.maxHp}`);
    this.lowhp.setAlpha(frac < 0.3 && p.hp > 0 ? 0.35 + 0.25 * Math.sin(this.scene.time.now / 160) : 0);
    // 상태이상 알약
    const key = Object.entries(p.status).map(([id, v]) => `${id}${v.stack ?? 1}${Math.ceil(v.left)}`).join(',');
    if (key !== this.chipKey) {
      this.chipKey = key;
      this.chips.removeAll(true);
      let x = 68 * s;
      for (const [id, v] of Object.entries(p.status)) {
        const d = STATUS[id];
        const t = this.T(0, 0, `${d.name}${v.stack > 1 ? `×${v.stack}` : ''} ${Math.ceil(v.left)}`, 9, '#ffffff', { bold: true, stroke: 2 }).setOrigin(0, 0.5);
        const w = t.width + 12 * s;
        const pg = this.scene.add.graphics().fillStyle(hex(d.color), 0.85).fillRoundedRect(x, this.chipY - 7 * s, w, 14 * s, 7 * s);
        t.setPosition(x + 6 * s, this.chipY);
        this.chips.add([pg, t]);
        x += w + 4 * s;
      }
    }
    // 스킬: 둥근 재사용 시계, 다 차면 번쩍
    for (const sl of this.slots) {
      const sk = st.skills[sl.k];
      const left = p.cd[sl.k] ?? 0;
      const ready = left <= 0;
      if (first || ready !== sl.ready) {
        this.drawIcon(sl.icon, sk.shape, sl.k, sl.x, sl.y - 3 * s, ready);
        sl.name.setText(sk.name).setColor(sk.changed ? '#ffbf47' : '#fff4e2');
        if (ready && !first) {
          const ring = this.scene.add.circle(sl.x, sl.y, 18 * s).setStrokeStyle(2 * s, 0xfff4e2, 1);
          this.scene.tweens.add({ targets: ring, radius: 30 * s, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
        }
        sl.ready = ready;
      }
      if (!ready) {
        const k = left / sk.cd;
        g.fillStyle(0x000000, 0.55).slice(sl.x, sl.y, 23 * s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k, false).fillPath();
        g.lineStyle(2 * s, COLORS.gold, 0.9).beginPath().arc(sl.x, sl.y, 23 * s, -Math.PI / 2 + Math.PI * 2 * k, Math.PI * 1.5, false).strokePath();
      }
      sl.sec.setText(ready ? '' : left < 1 ? left.toFixed(1) : String(Math.ceil(left)));
    }
    if (p.guard > 0) {
      const sl = this.slots[3];
      g.lineStyle(2 * s, 0x9ad0ff, 1).strokeRoundedRect(sl.x - 25 * s, sl.y - 25 * s, 50 * s, 50 * s, 8 * s);
    }
    // 퀵슬롯
    for (const q of this.qslots) {
      if (!q.id) continue;
      const n = st.bag[q.id] ?? 0;
      q.cnt.setText(String(n)).setColor(n ? '#ffffff' : '#8a7a6a');
      q.icon?.setAlpha(n > 0 ? 1 : 0.3);
    }
    // 연타는 잠시 맞히지 않으면 사라진다
    if (this.comboLeft > 0) {
      this.comboLeft -= dt;
      if (this.comboLeft <= 0) { this.scene.tweens.add({ targets: [this.comboText, this.comboSub], alpha: 0, duration: 300 }); this.combo = 0; }
    }
  }
}
