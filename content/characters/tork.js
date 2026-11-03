// 토르크 — 잿빛 엄니 족장 우르가(가칭)의 아들. 인간을 증오하는 젊은 전사. 레온과 짝을 이룬다(둘 다 쓸모를 증명해야 하는 자식)
export default {
  id: 'tork',
  name: '토르크',
  role: '잿빛 엄니 족장의 아들',
  age: 24,
  color: '#9ac070',
  erasable: false,
  extra: true,
  monster: true,
  // 오크 전사와 같은 바탕에 붉은 천 망토, 오른쪽 엄니가 부러졌다
  sprite: {
    base: 'Hunter',
    shareBase: 'hunter',
    recolor: { ef914f: '86b064', fce2ca: 'b4dc94', d14b34: '1e1a16', '8f3e56': '120e0c', c8966b: '62884a' },
    edits: [{ type: 'tusks', broken: true }, { type: 'cape', color: '8a2e24', dark: '5e1e18' }],
  },
  silhouette: '오크 전사와 같은 체구에 붉은 망토, 한쪽 엄니가 부러졌다.',
  bubbles: {},
  barks: ['인간은 곡식을 쌓아 두고 굶는 자를 본다.', '흰 아가리가 우리 땅을 먹었다. 너희 땅은 아직 남았지.', '(부러진 엄니를 드러낸다)'],
  fleeBarks: ['…기억해 두겠다, 인간.', '어머니께 뭐라고 하나…', '이번 겨울은 길다. 다시 온다.'],
  remnant: null,
};
