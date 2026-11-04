// 토빈 — 물레방아 마을의 방앗간지기. 제단에 무릎 꿇는 이웃들을 못마땅해한다. "물레방아만 돌면 됐지."
export default {
  id: 'tobin', name: '토빈', role: '방앗간지기', age: 45, color: '#d0b080', erasable: true, home: 'mill',
  // 필드 스프라이트: 'Villager3' 바탕(농부와 같은 바탕)에 밀가루 묻은 앞치마 망토를 덧그렸다
  sprite: { base: 'Villager3', shareBase: 'farmer', recolor: {}, edits: [{ type: 'cape', color: 'e8dcc0', dark: 'b8aa90' }] },
  silhouette: '밀가루 묻은 앞치마를 등까지 두른 사내.',
  bubbles: { mill: ['물레방아만 돌면 됐지.', '제단에 절할 시간에 밀이나 빻지.'] },
  schedule: [
    { from: '05:00', at: 'millDoor', face: 'down', say: ['물 좋다. 오늘도 돈다.'] },
    { from: '18:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '21:00', home: true },
  ],
  remnant: { prop: 'crate' },
};
