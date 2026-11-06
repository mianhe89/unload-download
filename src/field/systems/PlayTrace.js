// 플레이테스트 발자취 (필드 부품): 10초마다 어디에 서 있었고, 그동안 얼마나 걸었고, 대사 중이었는지를 기록에 남긴다.
// 기록이 꺼져 있으면(PlayLog.enabled false) 아무것도 하지 않는다.
import { PlayLog } from '../../core/playtest/PlayLog.js';

const EVERY = 10; // 초
const TILE = 16;

export class PlayTrace {
  constructor(field) {
    this.field = field;
    this.t = 0;
    this.walked = 0;
    this.last = null;
    if (!PlayLog.enabled) return;
    PlayLog.log('phase', { ch: field.chapterId, ph: field.phaseId, room: field.roomId ?? undefined, map: field.mapDef?.id });
  }

  update(dt, busy) {
    if (!PlayLog.enabled) return;
    const p = this.field.player;
    if (this.last) this.walked += Math.hypot(p.x - this.last.x, p.y - this.last.y);
    this.last = { x: p.x, y: p.y };
    this.t += dt;
    if (this.t < EVERY) return;
    PlayLog.log('trace', { ph: this.field.phaseId, x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE), walk: Math.round(this.walked / TILE), busy: busy || undefined });
    this.t = 0;
    this.walked = 0;
  }
}
