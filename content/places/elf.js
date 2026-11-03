// 엘프 마을에 들르기 (1~3장). 깊은 숲을 한 그루도 베지 않았어야 엘프가 모습을 보인다(maxForestChops: 0).
// 조금이라도 벴다면 마을은 있지만 사람은 숨는다. 지나치게 베면 마을 자체가 보이지 않는다(src/world/visits.js).
import { N, T, WALK } from '../chapters/dsl.js';
import { ELF_LINES } from '../farm/farm.js';

const untouched = { maxForestChops: 0 };

export const phases = {
  elf: {
    map: 'elf', visit: true, keepTime: true, place: '엘프 마을', time: 'day', clock: true,
    player: { at: [35, 14], face: 'left' },
    npcs: {
      elf: { at: [12, 13], mode: 'idle', face: 'right', when: untouched },
      sylwen: { at: [27, 12], mode: 'idle', face: 'down', when: untouched },
    },
    onEnter: 'elf.arrive',
    events: [
      { id: 'elf.hidden', when: { minForestChops: 1 }, trigger: { zone: 'glade' }, run: 'elf.hidden' },
      { id: 'elf.sylwen', when: untouched, trigger: { near: 'sylwen', r: 3 }, run: 'elf.sylwen' },
    ],
  },
};

export const script = {
  'elf.arrive': [
    WALK,
    N('나무가 하늘을 덮었다. 그 사이로 집들이 있었다. 지은 게 아니라 숲이 내준 자리 같았다.', { unlessFlag: 'visited.elf' }),
    { flag: 'visited.elf' },
    { flag: 'visited.surface:2,12' },
  ],
  'elf.hidden': [
    WALK,
    N('아무도 없었다. 그런데 나무 뒤에서 누군가 숨을 죽이는 기척이 났다.'),
    N('도끼 냄새가 나는 사람에게, 이 숲은 얼굴을 보여 주지 않는다.'),
  ],
  'elf.sylwen': [
    T('sylwen', '인간이 여기까지. …숲을 베지 않은 발이군. 그래서 들인 것이다.'),
    T('sylwen', '오래 머물지는 마라. 너희는 시끄럽고, 빨리 늙고, 빨리 잊는다.'),
    T('me', '…저는 잊지 않아요. 아무도 기억 못 하는 이름을 기억해요.'),
    N('실웬이 처음으로 나를 똑바로 보았다.'),
    T('sylwen', '그렇다면 이름을 나무에 새겨라. 돌은 깨지고 사람은 잊지만, 나무는 자란다. 새긴 이름도 함께 자란다.'),
    T('sylwen', '이 숲은 이 세계에서 제일 오래된 곳이다. 지워지는 게 가장 늦게 오는 곳이지. …그러니 베지 마라.'),
    { flag: 'elf.sylwen' },
  ],
  'talk.elf.elf': [WALK, ...ELF_LINES.map((l) => T('elf', l))],
  'talk.elf.sylwen': [WALK, T('sylwen', '…숲이 오늘은 조용하다. 그거면 됐다.')],
};
