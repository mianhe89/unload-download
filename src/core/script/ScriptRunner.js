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
//   { mode: 'walk' }           (라벨 첫 노드) 걸으며 듣는 대사 — 멈추지 않고, 말풍선이 저절로 넘어가며, 멀면 놓친다
//
// 글자 치환: {bells} {loads} {lastErased}(가장 최근에 지워진 사람의 이름)
//
// 조건 (모든 노드에 붙일 수 있음)
//   ifErased / unlessErased: id | [ids]
//   ifErasedAny: true
//   minLoads / maxLoads: n
//   ifFlag / unlessFlag: name | [name…]  (목록이면 모두 켜져 있어야 / 하나라도 켜져 있으면 안 된다)
//   afterTime / beforeTime: 'HH:MM', minDay / maxDay: n   게임 안 시각·날짜 (시계가 도는 날)
//   anyOf: [조건, 조건…]   그중 하나라도 맞으면
//   ifQuest: 'id' | 'id.done' | 'id.step2'      퀘스트 진행 중 / 끝남 / 세 번째 단계(0부터)에 와 있음

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

const hm = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
// 'id' 진행 중 | 'id.done' 끝남 | 'id.step2' 세 번째 단계에 와 있음
function questIs(ctx, spec) {
  const m = /^(.*?)(?:\.(done|step(\d+)))?$/.exec(spec);
  const q = ctx.quest?.(m[1]);
  if (!q) return false;
  if (!m[2]) return q.state === 'active';
  if (m[2] === 'done') return q.state === 'done';
  return q.state === 'active' && q.step === Number(m[3]);
}

export function passes(node, ctx) {
  if (node.ifErased && !arr(node.ifErased).every((id) => ctx.isErased(id))) return false;
  if (node.unlessErased && arr(node.unlessErased).some((id) => ctx.isErased(id))) return false;
  if (node.ifErasedAny && ctx.erasedCount() === 0) return false;
  if (node.minLoads != null && ctx.loads() < node.minLoads) return false;
  if (node.maxLoads != null && ctx.loads() > node.maxLoads) return false;
  if (node.ifFlag && !arr(node.ifFlag).every((f) => ctx.flag(f))) return false;
  if (node.unlessFlag && arr(node.unlessFlag).some((f) => ctx.flag(f))) return false;
  if (node.afterTime && !(ctx.minute?.() >= hm(node.afterTime))) return false;
  if (node.beforeTime && !(ctx.minute?.() < hm(node.beforeTime))) return false;
  if (node.minDay != null && !(ctx.day?.() >= node.minDay)) return false;
  if (node.maxDay != null && !(ctx.day?.() <= node.maxDay)) return false;
  if (node.anyOf && !node.anyOf.some((c) => passes(c, ctx))) return false;
  if (node.ifQuest && !questIs(ctx, node.ifQuest)) return false;
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

  // 'walk' | 'block'
  mode(label) { return this.script[label]?.[0]?.mode ?? 'block'; }

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
      if (node.mode) continue;
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
      .replaceAll('{loads}', String(this.ctx.loads()))
      .replaceAll('{lastErased}', this.ctx.lastErasedName?.() ?? '');
  }
}
