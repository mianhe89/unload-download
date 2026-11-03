// 마를로 — 항구의 늙은 어부. 바다 유적이 썰물에 드러나는 때를 귀신같이 안다. 말끝마다 "바다는 기억해."
export default {
  id: 'marlo', name: '마를로', role: '늙은 어부', age: 66, color: '#8ab0c8', erasable: true, home: 'harbor',
  // 필드 스프라이트: 'Villager3' 바탕(농부와 같은 바탕)에 남색 비옷을 덧그렸다
  sprite: { base: 'Villager3', shareBase: 'farmer', recolor: {}, edits: [{ type: 'cape', color: '2a3a5a', dark: '1a2640' }] },
  silhouette: '구부정한 노인, 남색 비옷.',
  bubbles: { harbor: ['물때가 바뀐다.', '바다는 기억해. 사람이 잊어도.'] },
  schedule: [
    { from: '05:00', at: 'pier', face: 'down', say: ['오늘은 물이 맑구먼.'] },
    { from: '12:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '17:00', at: 'pier', face: 'down' },
    { from: '20:00', home: true },
  ],
  remnant: { prop: 'barrel' },
};
