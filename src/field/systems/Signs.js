// 건물 이름 명패: 이름 있는 건물(맵 objects의 name)의 문 앞에 다가가면 문 위에 이름이 뜬다("호르트네 빵집").
// 그 집 사람(owner, 없으면 residents의 첫 사람)이 지워졌으면 세상은 그 이름을 모른다 — nameGone("빈 가게") 또는 '빈집'.
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { characters } from '../../../content/characters/index.js';
import { goneIds } from '../../core/script/speech.js';
import { TILE } from '../../../content/maps/village.js';
import { doorStep } from './Schedules.js';

const NEAR = 2.6 * TILE;

export class Signs {
  constructor(field) {
    this.field = field;
    this.timer = 0;
    this.shown = null;
    this.doors = (field.mapDef.objects ?? []).filter((o) => o.name).map((o) => {
      const d = doorStep(o);
      return d && { o, x: d[0] * TILE + TILE / 2, y: d[1] * TILE };
    }).filter(Boolean);
  }

  label(o) {
    const who = o.owner ?? o.residents?.[0];
    if (!who || who === 'me') return o.name;
    const gone = goneIds(characters, { erased: WorldMemory.world.erased.map((e) => e.id), phase: this.field.phaseId });
    return gone.includes(who) ? o.nameGone ?? '빈집' : o.name;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.15;
    const p = this.field.player;
    const d = this.doors.map((x) => ({ ...x, dist: Math.hypot(x.x - p.x, x.y - p.y) })).filter((x) => x.dist < NEAR).sort((a, b) => a.dist - b.dist)[0];
    const key = d ? `${d.o.at}` : null;
    if (key === this.shown) return;
    this.shown = key;
    if (d) this.field.ui.sign?.show(this.label(d.o), d.x, d.y - 3.2 * TILE);
    else this.field.ui.sign?.hide();
  }
}
