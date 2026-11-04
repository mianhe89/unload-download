// 북쪽의 사자 — 숨겨진 왕국(가칭 노르데)에서 온 기사. 레온을 데리러 왔다. 문장 없는 검은 갑옷.
export default {
  id: 'envoy', name: '북쪽의 사자', role: '숨겨진 왕국의 기사', color: '#8a8a9a', erasable: false, extra: true,
  // 필드 스프라이트: 'Knight' 바탕(톰과 같은 바탕)을 검게, 문장 없는 검은 망토를 덧그렸다
  sprite: { base: 'Knight', shareBase: 'tom', recolor: { '8d977f': '3a3a44', '5f7160': '2a2a32' }, edits: [{ type: 'cape', color: '141418', dark: '0a0a0e' }] },
  silhouette: '문장 없는 검은 갑옷과 망토.',
  bubbles: {},
  remnant: null,
};
