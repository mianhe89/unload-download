// 헬가 — 드워프 광부. 갱도 지도를 머릿속에 다 넣고 다닌다. 요즘 지도와 갱도가 안 맞는 데가 있어 신경이 곤두서 있다.
export default {
  id: 'helga', name: '헬가', role: '드워프 광부', age: 148, color: '#c8a0e0', erasable: true, home: 'dwarf',
  // 필드 스프라이트: 'OldWoman' 바탕(할머니와 같은 바탕)에 주황 광부 머리띠를 덧그렸다
  sprite: { base: 'OldWoman', shareBase: 'granny', recolor: {}, edits: [{ type: 'headband', color: 'e88a2a' }] },
  silhouette: '작고 다부진 몸, 주황 머리띠, 곡괭이.',
  bubbles: { dwarf: ['갱도는 정직해. 사람이 헷갈릴 뿐이지.', '…셋째 갈래가 어디로 갔더라.'] },
  schedule: [
    { from: '05:00', at: 'mineRoad', face: 'up', say: ['내려간다!'] },
    { from: '14:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '20:00', home: true },
  ],
  remnant: { prop: 'crate' },
};
