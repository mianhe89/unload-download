// 페이즈 이벤트를 지켜보다가 조건이 맞으면 컷신을 부른다.
// Phaser에 의존하지 않는 순수 로직이라 Node에서 그대로 시뮬레이션할 수 있다(tools/simulate.mjs).
//
// world (매 프레임 필드가 넘겨주는 상태)
//   time               페이즈 시작 후 경과 초
//   player             { x, y, idleTime }  (px)
//   pos(name)          인물/장소 이름 → { x, y } (px) | null(없음)
//   inZone(name)       플레이어가 구역 안인가
//   pickedAll(group)   묶음을 다 주웠는가
//   flag(name)         플래그 값
//   flagTime(name)     플래그가 켜진 시각(페이즈 시간 기준) | undefined
//   passes(when)       대본 조건 검사
const TILE = 16;

export class EventDirector {
  constructor(events) {
    this.events = events.map((e) => ({ ...e, fired: false, dwell: 0, ticked: new Set() }));
  }

  // 이번 프레임에 실행할 { run, id } 목록과 띄울 말풍선 목록
  update(dt, world, busy) {
    const runs = [];
    const bubbles = [];
    if (busy) return { runs, bubbles };
    for (const ev of this.events) {
      if (ev.fired) continue;
      if (world.flag(`done.${ev.id}`)) { ev.fired = true; continue; }
      if (ev.when && !world.passes(ev.when)) continue;
      const t = ev.trigger;
      if (this.check(ev, t, dt, world, bubbles)) {
        ev.fired = true;
        runs.push({ id: ev.id, run: ev.run });
        break; // 한 프레임에 컷신 하나
      }
    }
    return { runs, bubbles };
  }

  check(ev, t, dt, world, bubbles) {
    const near = (name, r) => {
      const p = world.pos(name);
      return p && Math.hypot(p.x - world.player.x, p.y - world.player.y) <= r * TILE;
    };

    if (t.minTime != null && world.time < t.minTime) return false;
    if (t.near && !t.pickedAll && !t.idle && !near(t.near, t.r)) return false;

    if (t.zone) return world.inZone(t.zone);
    if (t.timer != null) return world.time >= t.timer;
    if (t.afterFlag) {
      const at = world.flagTime(t.afterFlag);
      return at != null && world.time - at >= (t.delay ?? 0);
    }
    if (t.count) return t.count.filter((f) => world.flag(f)).length >= t.n;
    if (t.pickedAll) return world.pickedAll(t.pickedAll) && (!t.near || near(t.near, t.r ?? 2));
    if (t.idle) return near(t.near, t.r) && world.player.idleTime >= t.idle;
    if (t.dwell) {
      if (!near(t.dwell, t.r)) return false;
      ev.dwell += dt;
      for (const tick of t.ticks ?? []) {
        if (ev.dwell >= tick.at && !ev.ticked.has(tick.at)) { ev.ticked.add(tick.at); bubbles.push(tick.bubble); }
      }
      return ev.dwell >= t.seconds;
    }
    if (t.near) return true;
    return false;
  }
}
