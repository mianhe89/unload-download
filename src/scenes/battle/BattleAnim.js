// 싸움의 몸짓 (전투 장면 부품): 주인공과 적이 '움직여서' 싸우게 한다.
//   주인공: 팩 시트의 공격 자세(5번째 줄)·뛰는 자세(6번째 줄), 칼을 실제로 휘두른다(베기는 호를 그리며, 연타마다 방향이 바뀐다),
//           찌르기는 칼이 뻗었다 돌아오고, 휘두르기는 몸이 한 바퀴 돈다. 막기는 칼을 가로로 든다. 구르기는 몸이 구른다.
//           가만히 있으면 숨 쉬듯 오르내리고, 맞으면 뒤로 젖혀진다. 쓰러지면 옆으로 넘어진다.
//   적: 걷는 몬스터는 방향마다 그림이 있다. 예고 동안 웅크려 힘을 모으고(뒤로 젖힌다), 칠 때 그쪽으로 튀어 나간다.
//       부채꼴 공격은 휘두른 자국이 남고, 탄을 쏘면 반동으로 밀린다. 돌진은 늘어나 보인다. 맞으면 눌렸다 돌아온다.
// 장면(ActionScene)은 사건을 넘기고(on*), 매 프레임 그릴 자리를 넘긴다(player·foe). 규칙은 건드리지 않는다.
import Phaser from 'phaser';
import { CHAR } from '../../../content/art/pack.js';

const ROW = { attack: 4, jump: 5 }; // 팩 캐릭터 시트의 줄: 공격 자세, 뛰는 자세
const OUTLINE = 0x2a2533;
const easeOut = (k) => 1 - (1 - k) ** 3;
const dirOf = (a) => (Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) > 0 ? 'right' : 'left') : (Math.sin(a) > 0 ? 'down' : 'up'));
const frameOf = (row, a) => row * CHAR.cols + CHAR.dirs[dirOf(a)];

export class BattleAnim {
  constructor(scene, { player, blade, bladeG, fx }) {
    this.scene = scene;
    this.player = player;
    this.blade = blade;      // 칼날 색
    this.g = bladeG;         // 칼을 그리는 붓 (싸움터 좌표)
    this.fx = fx;
    this.act = null;         // 주인공의 지금 몸짓 { kind, t, dur, ... }
    this.recoil = null;      // 맞아 젖혀짐 { x, y, t }
    this.side = 1;           // 베기 방향 (연타마다 바뀐다)
    this.down = null;        // 쓰러짐
  }

  // ── 주인공 사건 ──
  onSkill(e) {
    const k = e.key;
    if (k === 'atk') {
      const third = e.combo === 2;
      this.side = e.combo === 1 ? -1 : 1;
      this.act = { kind: 'swing', t: 0, dur: third ? 0.22 : 0.15, face: e.face, half: ((e.arc ?? 100) * Math.PI) / 360, side: this.side, reach: e.range ?? 24, third };
    } else if (k === 'q') {
      this.act = { kind: e.shape === 'arc' ? 'swing' : 'thrust', t: 0, dur: 0.2, face: e.face, half: ((e.arc ?? 150) * Math.PI) / 360, side: 1, reach: e.range ?? 44 };
    } else if (k === 'w') this.act = { kind: 'spin', t: 0, dur: 0.26, face: e.face, side: this.side, reach: e.range ?? 32 };
    else if (k === 'r') this.act = { kind: 'dash', t: 0, dur: 0.2, face: e.face };
  }

  onDodge(e) { this.act = { kind: 'roll', t: 0, dur: 0.2, face: e.dir, spin: Math.cos(e.dir) >= 0 ? 1 : -1 }; }

  onHurt(from) { this.recoil = { a: from, t: 0 }; }

  onLose() { this.down = { t: 0 }; this.act = null; }

  // ── 주인공 그리기 ──  p: 엔진 상태, at: 그릴 자리, dt
  //   돌려주는 값: 이 프레임에 걷는 그림을 틀어도 되는가(몸짓 중이면 자세 그림을 쓴다)
  drawPlayer(p, at, dt, now) {
    const spr = this.player, g = this.g;
    g.clear();
    let ox = 0, oy = 0, sx = 1, sy = 1, angle = 0, pose = null;
    const a = this.act;
    if (a) {
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      if (a.kind === 'swing') {
        pose = frameOf(ROW.attack, a.face);
        ox = Math.cos(a.face) * 1.5 * Math.sin(k * Math.PI); oy = Math.sin(a.face) * 1.5 * Math.sin(k * Math.PI);
        sx = 1 + 0.08 * Math.sin(k * Math.PI);
        // 칼: 한쪽 끝에서 다른 쪽 끝으로 호를 그린다. 지나간 자리엔 옅은 잔상 셋
        const e = easeOut(k);
        const from = a.face - a.half * a.side, to = a.face + a.half * a.side;
        const len = Math.min(16, a.reach * 0.62) * (a.third ? 1.15 : 1);
        for (let i = 3; i >= 0; i -= 1) {
          const kk = Math.max(0, e - i * 0.12);
          const ang = from + (to - from) * kk;
          this.bladeLine(at.x + ox, at.y + oy - 3, ang, len, i === 0 ? 1 : 0.35 - i * 0.08, i === 0 ? 2 : 1);
        }
      } else if (a.kind === 'thrust') {
        pose = frameOf(ROW.attack, a.face);
        const out = k < 0.35 ? easeOut(k / 0.35) : 1 - (k - 0.35) / 0.65 * 0.6;
        ox = Math.cos(a.face) * 2.5 * out; oy = Math.sin(a.face) * 2.5 * out;
        sx = 1 + 0.1 * out; sy = 1 - 0.06 * out;
        this.bladeLine(at.x + ox, at.y + oy - 3, a.face, 10 + 14 * out, 1, 2);
      } else if (a.kind === 'spin') {
        // 몸이 한 바퀴: 보는 쪽 그림이 아래 → 옆 → 위 → 옆으로 돈다
        const ang = a.face + Math.PI * 2 * easeOut(k) * a.side;
        pose = frameOf(ROW.attack, ang);
        for (let i = 4; i >= 0; i -= 1) this.bladeLine(at.x, at.y - 3, ang - i * 0.35 * a.side, 15, i === 0 ? 1 : 0.4 - i * 0.07, i === 0 ? 2 : 1);
      } else if (a.kind === 'dash') {
        pose = frameOf(ROW.jump, a.face);
        sx = 1.15; sy = 0.9;
        this.bladeLine(at.x, at.y - 2, a.face, 12, 1, 2);
      } else if (a.kind === 'roll') {
        // 구른다: 몸이 한 바퀴 돌며 납작해진다 (가운데를 축으로)
        pose = frameOf(ROW.jump, a.face);
        angle = 360 * easeOut(k) * a.spin;
        sx = 0.92; sy = 0.86;
        oy = -4; // 원점이 발이라, 몸 가운데로 돌리려고 올린다
      }
      if (a.t >= a.dur) this.act = null;
    }
    // 막기: 칼을 가로로 앞에 든다
    if (!this.act && p.guard > 0) {
      pose = frameOf(ROW.attack, p.face);
      const c = at.x + Math.cos(p.face) * 6, d = at.y - 3 + Math.sin(p.face) * 6;
      this.bladeLine(c - Math.cos(p.face + Math.PI / 2) * 6, d - Math.sin(p.face + Math.PI / 2) * 6, p.face + Math.PI / 2, 12, 1, 2);
    } else if (!this.act && !this.down) {
      // 평소: 칼을 비스듬히 아래로 든다. 걸으면 흔들리고, 서 있으면 숨 쉬듯
      const bob = p.moving ? Math.sin(now / 70) * 0.8 : 0;
      this.bladeLine(at.x + Math.cos(p.face) * 3, at.y - 2 + Math.sin(p.face) * 3 + bob, p.face + 0.5, 9, 1, 2);
      if (!p.moving) sy = 1 + 0.025 * Math.sin(now / 320);
    }
    // 맞아 젖혀짐: 맞은 반대쪽으로 2px, 빠르게 돌아온다
    if (this.recoil) {
      this.recoil.t += dt;
      const r = Math.max(0, 1 - this.recoil.t / 0.16);
      ox += Math.cos(this.recoil.a) * 2.5 * r; oy += Math.sin(this.recoil.a) * 2.5 * r;
      sx *= 1 + 0.08 * r; sy *= 1 - 0.08 * r;
      if (r <= 0) this.recoil = null;
    }
    // 쓰러짐: 옆으로 넘어지고 흐려진다
    if (this.down) {
      this.down.t += dt;
      const k = Math.min(1, this.down.t / 0.45);
      angle = 90 * easeOut(k); oy = -3 * k;
      pose = frameOf(ROW.jump, Math.PI / 2);
    }
    spr.setPosition(at.x + ox, at.y + oy).setScale(sx, sy).setAngle(angle);
    spr.setOrigin(0.5, angle ? 0.5 : 0.75);
    if (pose !== null) { spr.anims.stop(); spr.setFrame(pose); }
    return pose === null;
  }

  // 칼 한 자루: 어두운 테두리 + 날 색 (alpha가 낮으면 잔상)
  bladeLine(x, y, a, len, alpha = 1, w = 2) {
    const g = this.g, x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.lineStyle(w + 1, OUTLINE, alpha).lineBetween(x, y, x2, y2);
    g.lineStyle(Math.max(1, w - 1), this.blade, alpha).lineBetween(x, y, x2, y2);
    if (alpha >= 1) g.fillStyle(0xe8c070, 1).fillRect(x - 1, y - 1, 2, 2); // 손잡이
  }

  // ── 적 ──
  // 칠 때: 몸이 그쪽으로 튀어 나가고(부채꼴은 휘두른 자국), 쏠 때는 반동
  onFoeAttack(v, e) {
    if (!v) return;
    v.act = { kind: e.kind, t: 0, dur: e.kind === 'lunge' ? 0.3 : 0.2, dir: e.dir };
    if (e.kind === 'sweep') this.fx.foeSwipe?.(e);
  }

  onFoeHurt(v) { if (v) v.hitT = 0.14; }

  // 적 그리기: v(그림 묶음), f(엔진의 적), at(그릴 자리), tell(예고 또는 null), toP(주인공 쪽 각도), moveA(움직인 쪽 각도 또는 null)
  drawFoe(v, f, at, tell, toP, moveA, dt, now) {
    const spr = v.spr, base = v.base;
    let ox = 0, oy = 0, sx = 1, sy = 1, angle = 0;
    const look = moveA ?? toP;
    // 방향 그림: 인물은 걷기/서기, 걷는 몬스터도 방향마다
    const D = f.def;
    if (D.art.char) {
      const key = `char.${D.art.char}.${dirOf(look)}`;
      const anims = this.scene.anims;
      if (anims.exists(key)) {
        if (tell && tell.left / tell.total < 0.35) { spr.anims.stop(); spr.setFrame(frameOf(ROW.attack, tell.dir)); } // 치기 직전: 공격 자세
        else if (v.act && v.act.kind !== 'shot') { spr.anims.stop(); spr.setFrame(frameOf(ROW.attack, v.act.dir)); }
        else if (moveA !== null) { if (spr.anims.currentAnim?.key !== key || !spr.anims.isPlaying) spr.play(key); }
        else { spr.anims.stop(); spr.setFrame(anims.get(key).frames[0].frame.name); }
      }
    } else if (D.art.mon && !D.boss) {
      const key = `mon.${D.art.mon}.${dirOf(look)}`;
      if (this.scene.anims.exists(key) && spr.anims.currentAnim?.key !== key) spr.play(key, true);
    }
    // 예고: 웅크려 힘을 모은다(노리는 반대쪽으로 젖힌다). 끝으로 갈수록 깊게
    if (tell) {
      const k = 1 - tell.left / tell.total;
      const c = Math.min(1, k * 1.3);
      sx *= 1 + 0.12 * c; sy *= 1 - 0.16 * c;
      ox -= Math.cos(tell.dir) * 2 * c; oy -= Math.sin(tell.dir) * 2 * c;
    }
    // 칠 때: 그쪽으로 튀어 나갔다 돌아온다. 돌진은 길게 늘어난다. 쏘면 뒤로 밀린다
    if (v.act) {
      const a = v.act;
      a.t += dt;
      const k = Math.min(1, a.t / a.dur), out = Math.sin(k * Math.PI);
      if (a.kind === 'shot' || a.kind === 'ring' || a.kind === 'motes') {
        ox -= Math.cos(a.dir) * 2 * out; oy -= Math.sin(a.dir) * 2 * out;
        sx *= 1 + 0.15 * out; sy *= 1 + 0.15 * out;
      } else if (a.kind === 'lunge') {
        sx *= 1 + 0.25 * out; sy *= 1 - 0.18 * out;
        if (Math.random() < 0.5) this.fx.puff(at.x, at.y + 3, 1, 0.8);
      } else {
        ox += Math.cos(a.dir) * 3 * out; oy += Math.sin(a.dir) * 3 * out;
        sx *= 1 + 0.1 * out; sy *= 1 - 0.1 * out;
      }
      if (a.t >= a.dur) v.act = null;
    }
    // 맞음: 눌렸다 돌아온다
    if (v.hitT > 0) {
      v.hitT -= dt;
      const r = Math.max(0, v.hitT / 0.14);
      sx *= 1 + 0.18 * r; sy *= 1 - 0.18 * r;
    }
    // 가만히 있으면 숨 쉬듯 (몬스터마다 박자가 다르게)
    if (!tell && !v.act && moveA === null) sy *= 1 + 0.03 * Math.sin(now / 280 + (v.phase ?? 0));
    // 기절: 비틀거린다
    if (f.status.stun) angle = Math.sin(now / 90) * 8;
    spr.setPosition(at.x + ox, at.y + oy).setScale(base * sx, base * sy).setAngle(angle);
    v.shadow.setPosition(at.x, at.y + D.radius * 0.7).setScale(1 + 0.1 * (sx - 1), 1);
  }
}

export { dirOf };
