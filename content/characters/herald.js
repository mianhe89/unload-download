// 영주의 전령 — 영주 기사단의 파란 망토를 두른 전령. 수확제 다음 날 아침, 북쪽 국경의 소식과 견습 모집령을 가져온다.
export default {
  id: 'herald', name: '영주의 전령', role: '영주 기사단 전령', color: '#7a9ad8', erasable: false, extra: true,
  // 필드 스프라이트: 'Knight' 바탕(톰과 같은 바탕)을 영주 기사단의 남색으로, 파란 망토를 덧그렸다
  sprite: { base: 'Knight', shareBase: 'tom', recolor: { '4e484a': '2e4a8a', '3b3643': '1e3060' }, edits: [{ type: 'cape', color: '3a5ab0', dark: '24387a' }] },
  silhouette: '남색 갑옷에 파란 망토.',
  bubbles: {},
  remnant: null,
};
