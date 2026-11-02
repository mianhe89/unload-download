// 컷신 실행기: 대본 라벨 하나를 끝까지 돌린다.
//   block(기본) — 플레이어가 멈추고 아래 대화창에 말한다. 중요한 장면만.
//   walk        — 플레이어는 계속 걷는다. 말은 화자 머리 위 말풍선으로 저절로 넘어가고,
//                 화자에게서 멀어지면 들리지 않는다(놓친 대사: missed.<라벨> 플래그).
// 동작(act)은 필드에 맡긴다.
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
    this.walking = this.runner.mode(label) === 'walk';
    if (!this.walking) this.field.setFrozen(true);
    const ui = this.field.ui;
    this.runner.start(label);
    for (;;) {
      const node = this.runner.next();
      if (node.done) break;
      if (node.say) {
        const who = node.who ? characters[node.who] : null;
        const text = this.field.speech(node.who, this.runner.format(node.say));
        if (this.walking) await this.field.walkLine(node.who, text, label);
        else await ui.say(who?.name ?? '', who?.color ?? '#cfc9dd', text, node.who);
      } else if (node.bubble) {
        this.field.bubble(node.bubble.who, node.bubble.text);
      } else if (node.fx) {
        await this.field.fx(node.fx);
      } else if (node.act) {
        await this.field.act(node);
      } else if (node.phase) {
        ui.closeDialog();
        this.busy = false;
        this.walking = false;
        this.field.goPhase(node.phase);
        return;
      } else if (node.end) {
        ui.closeDialog();
        this.busy = false;
        this.walking = false;
        this.field.endChapter(node.next);
        return;
      }
    }
    ui.closeDialog();
    this.busy = false;
    this.walking = false;
    this.field.setFrozen(false);
    const next = this.queue.shift();
    if (next) this.run(next);
  }
}
