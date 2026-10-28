// 컷신 실행기: 대본 라벨 하나를 끝까지 돌린다. 도는 동안 플레이어는 멈춘다.
// 말은 UI 씬의 대화창에, 동작(act)은 필드에 맡긴다.
import { ScriptRunner } from '../core/script/ScriptRunner.js';
import { characters } from '../../content/characters/index.js';

export class Cutscene {
  constructor(field, script, ctx) {
    this.field = field;
    this.runner = new ScriptRunner(script, ctx);
    this.busy = false;
    this.queue = [];
  }

  has(label) { return this.runner.has(label); }

  play(label) {
    if (this.busy) { this.queue.push(label); return Promise.resolve(); }
    return this.run(label);
  }

  async run(label) {
    this.busy = true;
    this.field.setFrozen(true);
    const ui = this.field.ui;
    this.runner.start(label);
    for (;;) {
      const node = this.runner.next();
      if (node.done) break;
      if (node.say) {
        const who = node.who ? characters[node.who] : null;
        await ui.say(who?.name ?? '', who?.color ?? '#cfc9dd', this.runner.format(node.say));
      } else if (node.bubble) {
        this.field.bubble(node.bubble.who, node.bubble.text);
      } else if (node.fx) {
        await this.field.fx(node.fx);
      } else if (node.act) {
        await this.field.act(node);
      } else if (node.phase) {
        ui.closeDialog();
        this.busy = false;
        this.field.goPhase(node.phase);
        return;
      } else if (node.end) {
        ui.closeDialog();
        this.busy = false;
        this.field.endChapter(node.next);
        return;
      }
    }
    ui.closeDialog();
    this.busy = false;
    this.field.setFrozen(false);
    const next = this.queue.shift();
    if (next) this.run(next);
  }
}
