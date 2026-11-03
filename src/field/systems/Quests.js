// 퀘스트(content/quests). 수첩(J)의 '퀘스트' 쪽에 보이고, 진행 중인 메인 퀘스트의 지금 단계가 화면 왼쪽 위 할 일이 된다.
// 받는 길: 주는 사람(giver)에게 E로 말 걸기 / 대본 노드 { quest: 'id' } / start.auto(조건이 맞으면 저절로)
// 단계(steps)마다 done 조건이 맞으면 다음 단계로(onDone이 있으면 그 컷신을 튼다), 마지막 단계가 끝나면 보상.
//   done: { flag } { talk: 인물 } { zone } { when: 대본 조건 } — 여럿 적으면 모두 맞아야 한다
import { QUESTS } from '../../../content/quests/index.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { passes } from '../../core/script/ScriptRunner.js';

export const KIND_NAME = { main: '메인', once: '일회성', repeat: '반복', route: '루트', choice: '선택', heart: '호감도' };

export class Quests {
  constructor(field) {
    this.field = field;
    this.timer = 0;
  }

  available(id) {
    const def = QUESTS[id];
    if (!def || WorldMemory.quest(id)) return false;
    return !def.start?.when || passes(def.start.when, this.field.ctx());
  }

  start(id) {
    const def = QUESTS[id];
    if (!def || WorldMemory.quest(id)) return;
    WorldMemory.setQuest(id, { state: 'active', step: 0 });
    this.field.ui.toast?.(`새 ${KIND_NAME[def.kind] ?? ''} 퀘스트 · ${def.title}`);
    this.check();
    this.field.refreshObjective?.();
  }

  // 대본의 { questStep: 'id' }: 지금 단계를 끝낸 것으로
  step(id) { if (WorldMemory.quest(id)?.state === 'active') this.advance(id); }

  // 말 걸었을 때: 진행 중 단계가 그 사람과의 대화면 그걸, 아니면 그 사람이 주는 퀘스트를 제안. 처리했으면 true
  onTalk(npcId) {
    if (this.check({ talk: npcId })) return true;
    const offer = Object.values(QUESTS).find((d) => d.giver === npcId && this.available(d.id));
    if (!offer) return false;
    this.field.sayOnce(npcId, offer.offer ?? `${offer.title}… 부탁 좀 해도 될까?`).then(() => this.start(offer.id));
    return true;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.5;
    for (const def of Object.values(QUESTS)) if (def.start?.auto && this.available(def.id)) this.start(def.id);
    this.check();
  }

  // 단계가 넘어갔으면 true. 한 번에 여러 단계가 맞으면(이어하기로 들어와 이미 지나온 단계) 연달아 넘긴다
  check(event) {
    let moved = false;
    for (const [id, def] of Object.entries(QUESTS)) {
      for (let guard = 0; guard < def.steps.length; guard += 1) {
        const q = WorldMemory.quest(id);
        if (q?.state !== 'active') break;
        const step = def.steps[q.step];
        if (!step || !this.met(step.done, event)) break;
        this.advance(id);
        moved = true;
        if (step.done.talk) break; // 대화 한 번은 한 단계만
      }
    }
    if (moved) this.field.refreshObjective?.();
    return moved;
  }

  met(done = {}, event) {
    const f = this.field;
    if (done.talk && event?.talk !== done.talk) return false;
    if (done.flag && !WorldMemory.run.flags[done.flag]) return false;
    if (done.zone && !f.world().inZone(done.zone)) return false;
    if (done.when && !passes(done.when, f.ctx())) return false;
    return Boolean(done.talk || done.flag || done.zone || done.when);
  }

  advance(id) {
    const def = QUESTS[id];
    const q = WorldMemory.quest(id);
    const step = def.steps[q.step];
    if (step?.onDone) this.field.cutscene.play(step.onDone);
    if (q.step + 1 < def.steps.length) { WorldMemory.setQuest(id, { step: q.step + 1 }); return; }
    WorldMemory.setQuest(id, { state: 'done' });
    const r = def.reward ?? {};
    for (const [who, n] of Object.entries(r.aff ?? {})) WorldMemory.addAffinity(who, n);
    if (r.flag) WorldMemory.setFlag(r.flag);
    if (r.run) this.field.cutscene.play(r.run);
    this.field.ui.toast?.(`완료 · ${def.title}`);
    this.field.refreshObjective?.();
  }

  // 화면 왼쪽 위에 띄울 지금 할 일: 진행 중인 메인 퀘스트, 없으면 가장 최근 퀘스트
  tracked() {
    const active = Object.entries(QUESTS).filter(([id]) => WorldMemory.quest(id)?.state === 'active');
    const pick = active.find(([, d]) => d.kind === 'main') ?? active.at(-1);
    if (!pick) return null;
    const [id, def] = pick;
    return { def, step: def.steps[WorldMemory.quest(id).step] };
  }

  // 수첩: 진행 중 / 끝낸 퀘스트
  journal() {
    const rows = Object.entries(QUESTS).map(([id, def]) => ({ id, def, q: WorldMemory.quest(id) })).filter((r) => r.q);
    return {
      active: rows.filter((r) => r.q.state === 'active').map((r) => ({ ...r, step: r.def.steps[r.q.step] })),
      done: rows.filter((r) => r.q.state === 'done'),
    };
  }
}
