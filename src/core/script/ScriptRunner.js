// 컷신 대본 해석기. 대본은 라벨 → 노드 배열이고, 라벨 하나가 컷신 하나다.
// 선택창은 없다. 갈림길은 플레이어의 '행동'(이벤트)이 만든다.
//
// 노드
//   { say, who? }              대사 (who 없으면 내레이션)
//   { fx: 'shake'|'flash'|'fade'|'bell'|'glitch' }
//   { aff: { id: n } }         호감도 변화
//   { flag: 'name' }           플래그 켜기
//   { phase: 'id' }            페이즈 전환 (같은 장 안)
//   { bubble: { who, text } }  말풍선 (대화창 없이)
//   { act: 'name', ...args }   필드에 맡기는 동작(인물 이동, 소환 등)
//   { goto: 'label' }
//   { end: 'title', next: { chapter, phase } }  타이틀로, 다음 이어하기 지점 지정
//
// 조건 (모든 노드에 붙일 수 있음)
//   ifErased / unlessErased: id | [ids]
//   ifErasedAny: true
//   minLoads / maxLoads: n
//   ifFlag / unlessFlag: name

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

export function passes(node, ctx) {
  if (node.ifErased && !arr(node.ifErased).every((id) => ctx.isErased(id))) return false;
  if (node.unlessErased && arr(node.unlessErased).some((id) => ctx.isErased(id))) return false;
  if (node.ifErasedAny && ctx.erasedCount() === 0) return false;
  if (node.minLoads != null && ctx.loads() < node.minLoads) return false;
  if (node.maxLoads != null && ctx.loads() > node.maxLoads) return false;
  if (node.ifFlag && !ctx.flag(node.ifFlag)) return false;
  if (node.unlessFlag && ctx.flag(node.unlessFlag)) return false;
  return true;
}

export class ScriptRunner {
  // ctx: { isErased(id), erasedCount(), loads(), flag(name), setFlag(name), addAffinity(id, n) }
  constructor(script, ctx) {
    this.script = script;
    this.ctx = ctx;
    this.label = null;
    this.index = 0;
  }

  has(label) { return Boolean(this.script[label]); }

  start(label) {
    if (!this.script[label]) throw new Error(`대본 라벨 없음: ${label}`);
    this.label = label;
    this.index = 0;
  }

  // 다음 '보여줄' 노드. 즉시 처리되는 노드(aff, flag, goto)는 여기서 소화한다.
  next() {
    for (let guard = 0; guard < 10000; guard += 1) {
      const nodes = this.script[this.label];
      if (this.index >= nodes.length) return { done: true };
      const node = nodes[this.index];
      this.index += 1;
      if (!passes(node, this.ctx)) continue;
      if (node.goto) { this.start(node.goto); continue; }
      // aff와 flag는 한 노드에 같이 올 수 있다. 둘 다 처리한 뒤 보여줄 게 없으면 다음으로
      if (node.aff) for (const [id, n] of Object.entries(node.aff)) this.ctx.addAffinity(id, n);
      if (node.flag) this.ctx.setFlag(node.flag);
      if ((node.aff || node.flag) && !node.say && !node.bubble && !node.fx && !node.act) continue;
      return node;
    }
    throw new Error('대본 무한 루프');
  }

  format(text) {
    return text
      .replaceAll('{bells}', String(13 + this.ctx.loads()))
      .replaceAll('{loads}', String(this.ctx.loads()));
  }
}
