// 대본 해석기. 대본은 라벨 → 노드 배열.
//
// 노드 종류
//   { say, who? }                  대사 (who 없으면 내레이션)
//   { bg: 'plaza' }                장소 전환
//   { fx: 'shake'|'flash'|'fade'|'bell' }  연출
//   { choice: [{ text, to, aff?, flag?, unlessErased? }] }
//   { goto: 'label' }
//   { set: { flag: value } }
//   { end: 'title' }               타이틀로
//
// 모든 노드에 붙일 수 있는 조건
//   ifErased: id | [ids]   해당 인물이 지워졌을 때만
//   unlessErased: id | [ids] 지워지지 않았을 때만
//   minLoads: n            누적 로드가 n 이상일 때만
//   maxLoads: n            누적 로드가 n 이하일 때만
//   ifFlag / unlessFlag: name
//   ifErasedAny: true      누군가 한 명이라도 지워졌을 때만

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

export class ScriptRunner {
  constructor(script, ctx) {
    this.script = script;   // { label: [nodes] }
    this.ctx = ctx;         // { isErased(id), loads, erasedCount, run }
  }

  passes(node) {
    const { ctx } = this;
    const flags = ctx.run.flags;
    if (node.ifErased && !arr(node.ifErased).every((id) => ctx.isErased(id))) return false;
    if (node.unlessErased && arr(node.unlessErased).some((id) => ctx.isErased(id))) return false;
    if (node.minLoads != null && ctx.loads < node.minLoads) return false;
    if (node.maxLoads != null && ctx.loads > node.maxLoads) return false;
    if (node.ifFlag && !flags[node.ifFlag]) return false;
    if (node.unlessFlag && flags[node.unlessFlag]) return false;
    if (node.ifErasedAny && ctx.erasedCount === 0) return false;
    return true;
  }

  // 현재 위치부터 조건을 통과하는 다음 노드를 돌려준다. 위치는 run에 기록된다.
  next() {
    const run = this.ctx.run;
    for (let guard = 0; guard < 10000; guard += 1) {
      const nodes = this.script[run.label];
      if (!nodes) throw new Error(`대본 라벨 없음: ${run.label}`);
      if (run.index >= nodes.length) return { end: 'title' };
      const node = nodes[run.index];
      run.index += 1;
      if (!this.passes(node)) continue;
      if (node.goto) { this.jump(node.goto); continue; }
      if (node.set) { Object.assign(run.flags, node.set); continue; }
      this.lastPos = { label: run.label, index: run.index - 1 }; // 이어하기 시 이 노드부터 다시 보여준다
      return node;
    }
    throw new Error('대본 무한 루프');
  }

  jump(label) {
    if (!this.script[label]) throw new Error(`대본 라벨 없음: ${label}`);
    this.ctx.run.label = label;
    this.ctx.run.index = 0;
  }

  options(node) {
    return node.choice.filter((o) => this.passes(o));
  }

  pick(option) {
    const run = this.ctx.run;
    for (const [id, v] of Object.entries(option.aff ?? {})) run.affinity[id] = (run.affinity[id] ?? 0) + v;
    if (option.flag) run.flags[option.flag] = true;
    if (option.to) this.jump(option.to);
  }

  format(text) {
    return text
      .replaceAll('{bells}', String(13 + this.ctx.loads))
      .replaceAll('{loads}', String(this.ctx.loads));
  }
}
