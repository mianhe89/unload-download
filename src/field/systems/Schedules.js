// 사람들의 하루 일과. 시각이 바뀌면 다음 할 일로 걸어서 옮긴다 — 툭 사라지지 않는다.
// 장사를 마치면 좌판을 정리하고, 걸어서 자기 집 문으로 들어간다. 집에 있는 동안은 필드에 보이지 않는다.
// 시계가 도는 페이즈(phase.clock)에서만 쓴다. 페이즈가 직접 배치한 인물(phase.npcs)은 그날의 이야기를 따르므로 일과를 쓰지 않는다.
//
// 인물 파일의 schedule (시각 순서대로):
//   { from: '06:00', at: 장소, mode?: 'idle'|'wander', radius?, face?, say?: ['도착하면 하는 말'] }
//   { from: '18:00', at: 장소, task: '(좌판을 정리한다)' }    — 그 자리에서 하는 일 (말풍선, 2.5초 뒤 다음으로)
//   { from: '19:00', home: true }                           — 자기 집(맵 objects의 residents에 이 사람이 있는 건물) 문으로
//   when: 조건(대본 조건 문법)을 달면 그 조건일 때만 쓰는 줄
// 인물 파일의 home: 사는 맵 id (기본 'village'). 그 맵에 있을 때만 일과를 산다
// 장소: 맵 spots 이름 또는 [tx, ty]
import { characters } from '../../../content/characters/index.js';
import { TILE } from '../../../content/maps/village.js';
import { OBJECTS } from '../../../content/art/pack.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { passes } from '../../core/script/ScriptRunner.js';
import { toMinute } from '../../../content/world/clock.js';
import { Npc } from '../Npc.js';
import { findPath, simplify } from './Path.js';

// 건물 문 앞 칸: 건물 그림의 아래쪽 가운데 바로 밑
export function doorStep(obj) {
  const def = OBJECTS[obj.type];
  if (!def) return null;
  const w = Math.round(def.rect[2] / TILE), h = Math.round(def.rect[3] / TILE);
  return [obj.at[0] + Math.floor(w / 2), obj.at[1] + h];
}

export class Schedules {
  constructor(field, map) {
    this.field = field;
    this.mapData = map;   // content/maps 모듈 (spots, objects)
    this.current = {};    // 인물별 지금 따르는 일과 줄
    this.inside = {};     // 집 안에 있는 인물
    this.timer = 0;
  }

  get active() { return Boolean(this.field.phase.clock); }

  // 이 페이즈에서 일과를 따를 사람: schedule이 있고, 페이즈가 직접 배치하지 않았고, 지워지지 않은 사람
  ids() {
    if (!this.active) return [];
    const placed = this.field.phase.npcs ?? {};
    const here = this.mapData.id ?? 'village';
    return Object.keys(characters).filter((id) => characters[id].schedule && (characters[id].home ?? 'village') === here && !placed[id] && !WorldMemory.isErased(id));
  }

  entryAt(id, minute) {
    const list = (characters[id].schedule ?? []).filter((e) => !e.when || passes(e.when, this.field.ctx()));
    if (!list.length) return null;
    let cur = list[list.length - 1]; // 첫 줄보다 이르면 전날 마지막 줄(보통 집)
    for (const e of list) if (toMinute(e.from) <= minute) cur = e;
    return cur;
  }

  homeDoor(id) {
    const home = (this.mapData.objects ?? []).find((o) => o.residents?.includes(id));
    return home ? doorStep(home) : null;
  }

  spotOf(entry, id) {
    if (entry.home) return this.homeDoor(id);
    if (Array.isArray(entry.at)) return entry.at;
    const s = this.mapData.spots[entry.at];
    return s ? [Math.round(s.x), Math.round(s.y)] : null;
  }

  // 페이즈 시작: 지금 시각의 자리에 바로 세운다 (걷지 않고)
  place() {
    const f = this.field;
    for (const id of this.ids()) {
      const e = this.entryAt(id, f.clock.minute);
      if (!e) continue;
      this.current[id] = e;
      if (e.home) { this.inside[id] = true; continue; }
      const at = this.spotOf(e, id);
      if (!at) continue;
      f.npcs[id] = new Npc(f, id, { at, mode: e.mode ?? 'idle', face: e.face ?? 'down', radius: e.radius });
    }
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.5;
    const f = this.field;
    for (const id of this.ids()) {
      const e = this.entryAt(id, f.clock.minute);
      if (!e || e === this.current[id]) continue;
      this.current[id] = e;
      this.go(id, e);
    }
  }

  // 다음 일로 옮기기
  go(id, e) {
    const f = this.field;
    let npc = f.npcs[id];
    // 집 안에 있었으면 문 앞에 나타나서 출발
    if (!npc) {
      const door = this.homeDoor(id);
      if (!door || e.home) return;
      npc = f.npcs[id] = new Npc(f, id, { at: door, mode: 'idle', face: 'down' });
      npc.sprite.setAlpha(0);
      f.tweens.add({ targets: npc.sprite, alpha: 1, duration: 500 });
      this.inside[id] = false;
    }
    if (e.task) f.bubble(id, e.task);
    const target = this.spotOf(e, id);
    if (!target) return;
    const from = [Math.floor(npc.x / TILE), Math.floor(npc.y / TILE)];
    const path = simplify(findPath((x, y) => this.mapData.isSolidTile(x, y), from, target, { cols: this.mapData.W, rows: this.mapData.H }));
    npc.mode = 'idle';
    const arrive = () => {
      if (e.home) { this.enterHome(id); return; }
      npc.mode = e.mode ?? 'idle';
      npc.wanderRadius = (e.radius ?? 2) * TILE;
      if (e.face) npc.face(e.face);
      if (e.say?.length) f.bubble(id, e.say[Math.floor(Math.random() * e.say.length)]);
    };
    // 할 일이 있으면 잠깐 그 일을 하고 나서 출발
    const leave = () => { if (path?.length) { npc.route = path; npc.onArrive = arrive; } else arrive(); };
    if (e.task) f.time.delayedCall(2500, leave); else leave();
  }

  enterHome(id) {
    const f = this.field;
    const npc = f.npcs[id];
    if (!npc) return;
    npc.face('up');
    f.tweens.add({ targets: npc.sprite, alpha: 0, duration: 600, onComplete: () => { npc.destroy(); delete f.npcs[id]; } });
    this.inside[id] = true;
  }

  isHome(id) { return Boolean(this.inside[id]); }
}
