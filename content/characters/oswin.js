// 오스윈 — 영주의 성 집사. 평생 성을 지켰다. 영주가 지워진 뒤, 빈 초상화 액자 앞에서 매일 아침 인사를 한다. 누구에게인지는 모른다.
export default {
  id: 'oswin', name: '오스윈', role: '영주의 성 집사', age: 61, color: '#b090c8', erasable: true, home: 'lordtown',
  // 필드 스프라이트: 'Noble' 바탕(촌장과 같은 바탕)에 보랏빛 집사 망토를 덧그렸다
  sprite: { base: 'Noble', shareBase: 'chief', recolor: { '4e484a': '4a3a5a', '3b3643': '2e2440' }, edits: [{ type: 'cape', color: '4a2a5a', dark: '2e1a3a' }] },
  silhouette: '반듯한 노신사, 보랏빛 망토.',
  bubbles: { lordtown: ['성은 오늘도 정돈되어 있습니다.', '…누구의 성이었더라.'] },
  schedule: [
    { from: '06:00', at: 'castleDoor', face: 'down', say: ['좋은 아침입니다, 영주님. …영주님?'] },
    { from: '12:00', at: 'market', mode: 'wander', radius: 2 },
    { from: '15:00', at: 'castleDoor', face: 'down' },
    { from: '21:00', home: true },
  ],
  remnant: { prop: 'bench' },
};
