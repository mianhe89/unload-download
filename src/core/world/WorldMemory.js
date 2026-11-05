// 핵심 메카닉: 되돌릴(로드) 때마다 세계가 조금씩 닳고, 네다섯 번에 한 번꼴로 누군가 지워진다.
// - 언제 지워지는지는 정해져 있다: 지난번 지워짐 뒤로 4번째, 그다음은 5번째 로드에 (4 · 9 · 13 · 18 …). ERASE_GAPS
// - 지워지는 건 무작위가 아니다. 플레이어가 가장 마음을 준 사람부터 사라진다.
// - 1부에선 마을 사람만. 2부(소집)부터는 히로인도 지워질 수 있다(HEROINES_FROM).
// - 지워지지 않는 로드도 흔적은 남는다: 로드 직후의 어긋난 대사(minLoads), 늘어나는 종소리({bells}).
// - RESET & START는 진행만 처음으로 돌린다. 지워진 사람은 돌아오지 않는다. 세계는 기억한다.
// - 개인 데이터는 막지 않는다(기획서 '조작 정책'). 공유 데이터는 GlobalWorld를 통해 서버에서 검증한다.
import { SaveRepository } from '../save/SaveRepository.js';
import { freshRun } from '../save/SaveSchema.js';
import { chapters } from '../../../content/chapters/index.js';
import { GlobalWorld } from './GlobalWorld.js';
import { ERASE_ORDER, HEROINE_ORDER, HEROINES_FROM } from '../../../content/characters/index.js';

// 지워짐 사이의 로드 수: 4, 5, 4, 5 …
export const ERASE_GAPS = [4, 5];
export function eraseDue(loads, erasedSoFar, lastAtLoad = 0) {
  return loads - lastAtLoad >= ERASE_GAPS[erasedSoFar % ERASE_GAPS.length];
}

export const WorldMemory = {
  get world() { return SaveRepository.get().world; },
  get run() { return SaveRepository.get().run; },
  get hasRun() { return Boolean(SaveRepository.get().run); },

  isErased(id) { return this.world.erased.some((e) => e.id === id); },

  // RESET & START
  startNew() {
    SaveRepository.update((d) => { d.run = freshRun('prologue', chapters.prologue.firstPhase); });
    return this.run;
  },

  // 페이즈 시작점 저장(체크포인트)
  checkpoint(chapter, phase) {
    SaveRepository.update((d) => { Object.assign(d.run, { chapter, phase }); });
  },

  // 마을 밖 길 맵에 있는 칸 (null = 마을 안). 이어하기는 여기서 시작한다
  setBag(bag) {
    SaveRepository.update((d) => { d.run.bag = bag; });
  },

  setHome(home) {
    SaveRepository.update((d) => { d.run.home = home; });
  },

  setWhere(where) {
    SaveRepository.update((d) => { d.run.where = where; });
  },

  // 장비 { head, armor, boots, gloves, acc1, acc2, necklace, backpack, offhand, weapon, weapon2 } — 바꾸면 주인공 도트와 액션 전투 스킬이 바뀐다
  setEquip(equip) {
    SaveRepository.update((d) => { d.run.equip = equip; });
  },

  // 가진 장비 { id: 개수 }
  // 의장 { armor } — 성능과 따로 겉모습만 (가방에서 V)
  setLook(look) {
    SaveRepository.update((d) => { d.run.look = look; });
  },

  setGear(gear) {
    SaveRepository.update((d) => { d.run.gear = gear; });
  },

  setFarm(farm) {
    SaveRepository.update((d) => { d.run.farm = farm; });
  },

  // 생활 상태 저장 (먹고·움직이고·쉰 결과)
  setLife(life) {
    SaveRepository.update((d) => { d.run.life = life; });
  },

  setFlag(name, value = true) {
    SaveRepository.update((d) => { d.run.flags[name] = value; });
  },

  // 게임 안 시계 { day, minute }
  setTime(time) {
    SaveRepository.update((d) => { d.run.time = time; });
  },

  // 퀘스트: { state: 'active'|'done', step }
  quest(id) { return this.run?.quests?.[id] ?? null; },
  setQuest(id, patch) {
    SaveRepository.update((d) => { d.run.quests ??= {}; d.run.quests[id] = { ...(d.run.quests[id] ?? {}), ...patch }; });
  },

  // 단서 수첩: 한 번 적히면 남는다
  hasClue(id) { return Boolean(this.run?.clues?.includes(id)); },
  addClue(id) {
    SaveRepository.update((d) => { d.run.clues ??= []; if (!d.run.clues.includes(id)) d.run.clues.push(id); });
  },

  addAffinity(id, amount) {
    SaveRepository.update((d) => { d.run.affinity[id] = (d.run.affinity[id] ?? 0) + amount; });
  },

  // CONTINUE = 로드 = 세계선 이동. 네다섯 번에 한 번, 대가로 한 명이 지워진다.
  load() {
    let victim = null;
    SaveRepository.update((d) => {
      d.world.loads += 1;
      const er = d.world.erased;
      if (eraseDue(d.world.loads, er.length, er.at(-1)?.atLoad ?? 0)) victim = pickVictim(d);
      if (victim) d.world.erased.push({ id: victim, atLoad: d.world.loads, at: Date.now() });
    });
    GlobalWorld.reportLoad({ victim });
    return { run: this.run, victim };
  },

  // 개발용: 세계까지 완전히 초기화
  async wipeAll() { await SaveRepository.wipe(); },
};

function pickVictim(d) {
  const pool = d.run?.flags?.[HEROINES_FROM] ? [...ERASE_ORDER, ...HEROINE_ORDER] : ERASE_ORDER;
  const alive = pool.filter((id) => !d.world.erased.some((e) => e.id === id));
  if (!alive.length) return null;
  const aff = d.run?.affinity ?? {};
  return alive.reduce((best, id) => ((aff[id] ?? 0) > (aff[best] ?? 0) ? id : best), alive[0]);
}

// 개발용: 브라우저 콘솔에서 await __ud.wipeAll() 후 새로고침
if (typeof window !== 'undefined') window.__ud = WorldMemory;
