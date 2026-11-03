// 게임 안 시계(content/world/clock.js). 시계가 도는 페이즈(phase.clock)에서만, 자유롭게 움직일 수 있을 때 흐른다
// (대화·컷신·수첩 중엔 멈춤). 세이브의 run.time에 남고, 조명이 시각을 따라 새벽·낮·노을·밤으로 바뀐다.
// 이야기 장면(축제의 밤, 종탑의 밤 등)처럼 시계가 없는 페이즈는 그 페이즈의 time 그대로다.
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { SECONDS_PER_MINUTE, DAY, toMinute, toHHMM, nightness, dayLabel } from '../../../content/world/clock.js';

const START_BY_TIME = { day: '09:00', dusk: '17:30', night: '20:00' };
const SAVE_EVERY = 10; // 게임 10분마다 저장

export class Clock {
  constructor(field) {
    this.field = field;
    const t = WorldMemory.run.time ?? { day: 1, minute: 9 * 60 };
    this.day = t.day;
    this.minute = t.minute;
    this.sinceSave = 0;
  }

  get running() { return Boolean(this.field.phase.clock); }

  // 페이즈(이야기의 하루)에 처음 들어설 때: 그날의 날짜(phase.day)와 시작 시각으로 맞춘다
  enterPhase(phase, firstTime) {
    if (!firstTime) return;
    if (phase.day != null) this.day = phase.day;
    this.minute = toMinute(phase.startAt ?? START_BY_TIME[phase.time] ?? '09:00');
    this.save();
  }

  get hhmm() { return toHHMM(this.minute); }
  get night() { return nightness(this.minute); }
  get isNight() { return this.night > 0.5; }
  get label() { return `${dayLabel(this.day)} ${this.hhmm}`; }

  update(dt) {
    if (!this.running) return;
    const step = dt / SECONDS_PER_MINUTE;
    this.minute += step;
    this.sinceSave += step;
    if (this.minute >= DAY) { this.minute -= DAY; this.day += 1; this.save(); }
    if (this.sinceSave >= SAVE_EVERY) this.save();
  }

  // 잠자리에 들기: 다음 날 아침으로
  sleepUntil(hhmm = '06:00') {
    this.day += 1;
    this.minute = toMinute(hhmm);
    this.save();
  }

  save() {
    this.sinceSave = 0;
    WorldMemory.setTime({ day: this.day, minute: Math.floor(this.minute) });
  }
}
