// 실웬 — 엘프 마을의 장로. 정통 판타지의 엘프: 아주 오래 살고, 아름답고, 자존심이 세고, 다른 종족에게 배타적이다.
// 숲을 베지 않고 들어온 발만 마을에 들인다. 이 세계에서 지워짐이 가장 늦게 오는 곳을 지킨다.
export default {
  id: 'sylwen', name: '실웬', role: '엘프 장로', age: 640, color: '#c8e8b0', erasable: false, home: 'elf',
  // 필드 스프라이트: 'Cavegirl' 바탕(엘프 파수꾼과 같은 바탕)에 은빛 잎사귀 망토를 덧그렸다
  sprite: { base: 'Cavegirl', shareBase: 'elf', recolor: { d14b34: '9ac0a0', '965340': '5a7a64', ef914f: 'f6d8b8', a3754e: 'd0aa88' }, edits: [{ type: 'cape', color: 'c8d8c0', dark: '8aa890' }] },
  silhouette: '잎사귀 머리, 은빛 잎사귀 망토, 꼿꼿한 등.',
  bubbles: { elf: ['인간의 발소리는 언제나 시끄럽군.', '…숲이 오늘은 조용하다.'] },
  remnant: null,
};
