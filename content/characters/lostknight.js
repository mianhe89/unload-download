// 길 잃은 기사 — 안개 길을 지키는 빈 갑옷. 안쪽에 영주 기사단의 옛 문장이 새겨져 있다.
// 셀레나 명부의 오래된 빈 줄 중 하나의 주인이다(docs/스토리.md '2장 · 안개 너머'). 2장의 첫 보스
export default {
  id: 'lostknight',
  name: '길 잃은 기사',
  role: '안개 길의 빈 갑옷',
  color: '#9aa4b0',
  erasable: false,
  extra: true,
  monster: true,
  // 필드 스프라이트: 'Knight' 바탕(톰과 같은 바탕)을 녹슨 쇳빛으로, 얼굴 자리는 텅 빈 어둠으로, 해진 망토를 덧그렸다
  sprite: {
    base: 'Knight',
    shareBase: 'tom',
    recolor: { '8d977f': '7c8288', '5f7160': '565c64', ef914f: '15151c', d14b34: '15151c', e3f1f5: 'b8c0c8' },
    edits: [{ type: 'cape', color: '3a3446', dark: '26222e' }],
  },
  silhouette: '녹슨 갑옷. 투구 안이 비어 있다. 해진 망토.',
  bubbles: {},
  remnant: null,
};
