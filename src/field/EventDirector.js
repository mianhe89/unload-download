// 페이즈 이벤트를 지켜보다가 조건이 맞으면 컷신을 부른다.
// Phaser에 의존하지 않는 순수 로직이라 Node에서 그대로 시뮬레이션할 수 있다(tools/simulate.mjs).
//
// world (매 프레임 필드가 넘겨주는 상태)
//   time               페이즈 시작 후 경과 초
//   player             { x, y, idleTime, running }  (px)
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
  // 그 사람에게 걸린, 지금 일어날 수 있는 이벤트(가까이 가기·곁에 머물기·가만히 서 있기). 말을 걸면(E) 바로 일으킨다.
  // 다가가기만 하면 저절로 일어나는 일을 놓치고 지나쳐도, 그 사람에게 말을 걸면 이어진다.
  pendingFor(id, world) {
    const ev = this.events.find((e) => !e.fired && !world.flag(`done.${e.id}`) && (!e.when || world.passes(e.when))
      && [e.trigger.near, e.trigger.dwell].includes(id) && !e.trigger.running && !e.trigger.pickedAll && !e.trigger.afterFlag);
    if (!ev) return null;
    ev.fired = true;
    return { id: ev.id, run: ev.run };
  }

  // 그 사람에게 지금 일어날 수 있는 이벤트가 남았나 (일으키지는 않는다 — 작은 지도의 노란 점)
  hasPendingFor(id, world) {
    return this.events.some((e) => !e.fired && !world.flag(`done.${e.id}`) && (!e.when || world.passes(e.when))
      && [e.trigger.near, e.trigger.dwell].includes(id) && !e.trigger.running);
  }

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
    if (t.running && !world.player.running) return false; // 뛰어서 지나갈 때만
    if (t.near && !t.pickedAll && !t.idle && !near(t.near, t.r)) return false;

    if (t.zone) return world.inZone(t.zone);
    if (t.timer != null) return world.time >= t.timer;
    if (t.afterFlag) {
      const at = world.flagTime(t.afterFlag);
      return at != null && world.time - at >= (t.delay ?? 0);
    }
    // people: count의 플래그마다 그 사람. 지워진 사람 몫은 빼고 센다(남은 사람이 n보다 적으면 남은 사람 모두)
    if (t.count) {
      const live = t.people ? t.count.filter((_, i) => world.passes({ unlessErased: t.people[i] })) : t.count;
      return live.filter((f) => world.flag(f)).length >= Math.min(t.n, live.length);
    }
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
