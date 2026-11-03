// 단서 수첩(content/clues.js). 조건이 맞는 순간 수첩에 적히고 짧은 알림이 뜬다. 한 번 적히면 남는다.
import { CLUES } from '../../../content/clues.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { passes } from '../../core/script/ScriptRunner.js';

export class Clues {
  constructor(field) {
    this.field = field;
    this.timer = 0;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.5;
    for (const c of CLUES) {
      if (WorldMemory.hasClue(c.id) || !passes(c.when, this.field.ctx())) continue;
      WorldMemory.addClue(c.id);
      this.field.ui.toast?.(`단서 · ${c.title}`);
    }
  }
}
