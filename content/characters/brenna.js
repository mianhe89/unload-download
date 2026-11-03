// 브렌나 — 서리 마을 경비대장. 40대. 북쪽 회색 고원의 오크와 십 년째 싸워 왔다. 말이 짧고 활이 빠르다.
// 오크를 미워하지만, 그들이 왜 내려오는지(고원이 안개에 먹힌다)는 어렴풋이 안다.
export default {
  id: 'brenna',
  name: '브렌나',
  role: '서리 마을 경비대장',
  age: 43,
  color: '#b8d0e8',
  erasable: false,
  home: 'frost',
  // 필드 스프라이트: 'Hunter' 바탕(사냥꾼과 같은 바탕)에 흰 털 망토를 덧그렸다
  sprite: { base: 'Hunter', shareBase: 'hunter', recolor: {}, edits: [{ type: 'cape', color: 'e4e8ee', dark: 'b8c0cc' }] },
  silhouette: '사냥꾼 차림에 흰 털 망토. 등에 활.',
  bubbles: { frost: ['해 지기 전에 볼일 끝내.', '북문 쪽은 얼씬도 하지 마라.', '…오늘도 조용하면 좋겠군.'] },
  schedule: [
    { from: '06:00', at: 'gate', face: 'up', say: ['북쪽 이상 없음.'] },
    { from: '11:00', at: 'plaza', mode: 'wander', radius: 3 },
    { from: '15:00', at: 'gate', face: 'up', say: ['해 지기 전에 화살을 세어 둬라.'] },
    { from: '21:00', home: true },
  ],
  remnant: null,
};
