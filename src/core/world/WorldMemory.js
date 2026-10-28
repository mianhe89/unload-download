// 핵심 메카닉: 로드할 때마다 누군가 지워진다.
// - 지워지는 건 무작위가 아니다. 플레이어가 가장 마음을 준 사람부터 사라진다.
// - RESET & START는 진행만 처음으로 돌린다. 지워진 사람은 돌아오지 않는다. 세계는 기억한다.
// - 개인 데이터는 막지 않는다(기획서 '조작 정책'). 공유 데이터는 GlobalWorld를 통해 서버에서 검증한다.
import { SaveRepository } from '../save/SaveRepository.js';
import { freshRun } from '../save/SaveSchema.js';
import { GlobalWorld } from './GlobalWorld.js';
import { ERASE_ORDER } from '../../../content/characters/index.js';

export const WorldMemory = {
  get world() { return SaveRepository.get().world; },
  get run() { return SaveRepository.get().run; },
  get hasRun() { return Boolean(SaveRepository.get().run); },

  isErased(id) { return this.world.erased.some((e) => e.id === id); },

  // RESET & START
  startNew() {
    SaveRepository.update((d) => { d.run = freshRun(); });
    return this.run;
  },

  // 페이즈 시작점 저장(체크포인트)
  checkpoint(chapter, phase) {
    SaveRepository.update((d) => { Object.assign(d.run, { chapter, phase }); });
  },

  setFlag(name, value = true) {
    SaveRepository.update((d) => { d.run.flags[name] = value; });
  },

  addAffinity(id, amount) {
    SaveRepository.update((d) => { d.run.affinity[id] = (d.run.affinity[id] ?? 0) + amount; });
  },

  // CONTINUE = 로드 = 세계선 이동. 대가로 한 명이 지워진다.
  load() {
    let victim = null;
    SaveRepository.update((d) => {
      d.world.loads += 1;
      victim = pickVictim(d);
      if (victim) d.world.erased.push({ id: victim, atLoad: d.world.loads, at: Date.now() });
    });
    GlobalWorld.reportLoad({ victim });
    return { run: this.run, victim };
  },

  // 개발용: 세계까지 완전히 초기화
  async wipeAll() { await SaveRepository.wipe(); },
};

function pickVictim(d) {
  const alive = ERASE_ORDER.filter((id) => !d.world.erased.some((e) => e.id === id));
  if (!alive.length) return null;
  const aff = d.run?.affinity ?? {};
  return alive.reduce((best, id) => ((aff[id] ?? 0) > (aff[best] ?? 0) ? id : best), alive[0]);
}

// 개발용: 브라우저 콘솔에서 await __ud.wipeAll() 후 새로고침
if (typeof window !== 'undefined') window.__ud = WorldMemory;
