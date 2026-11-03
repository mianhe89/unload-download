// 넬 — 항구 생선 가게 주인. 목소리가 크고 소문을 제일 먼저 듣는다. 남쪽 바다 어딘가에 인어의 나라가 있다고 믿는다.
export default {
  id: 'nell', name: '넬', role: '생선 가게 주인', age: 34, color: '#e8b0c8', erasable: true, home: 'harbor',
  // 필드 스프라이트: 'Villager2' 바탕(아낙과 같은 바탕)에 푸른 머릿수건을 덧그렸다
  sprite: { base: 'Villager2', shareBase: 'woman', recolor: {}, edits: [{ type: 'headband', color: '3a6aa8' }] },
  silhouette: '푸른 머릿수건, 걷어 올린 소매.',
  bubbles: { harbor: ['오늘 고등어 좋아! 싸게 줄게!', '들었어? 남쪽 바다에서 노래가 들린대.'] },
  schedule: [
    { from: '06:00', at: 'fishShop', face: 'down', say: ['생선 들어왔어요!'] },
    { from: '15:00', at: 'plaza', mode: 'wander', radius: 3 },
    { from: '19:00', home: true },
  ],
  remnant: { prop: 'crate' },
};
