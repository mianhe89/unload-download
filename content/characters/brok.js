// 브로크 — 드워프 마을의 늙은 대장장이. 맹세를 중히 여기고 고집이 세다. 쇠를 보면 그 쇠를 두드린 사람의 마음을 읽는다고 한다.
export default {
  id: 'brok', name: '브로크', role: '드워프 대장장이', age: 212, color: '#d89a5a', erasable: true, home: 'dwarf',
  // 필드 스프라이트: 'OldMan' 바탕(노인과 같은 바탕)을 그을린 가죽 색으로, 무거운 가죽 망토를 덧그렸다
  sprite: { base: 'OldMan', shareBase: 'oldman', recolor: {}, edits: [{ type: 'cape', color: '5a3a22', dark: '3a2414' }] },
  silhouette: '짧고 단단한 몸, 흰 수염, 가죽 망토.',
  bubbles: { dwarf: ['쇠는 거짓말을 안 한다.', '맹세 없이 두드린 쇠는 쉽게 부러지지.'] },
  schedule: [
    { from: '06:00', at: 'forgeDoor', face: 'down', say: ['불 올려라!'] },
    { from: '13:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '15:00', at: 'forgeDoor', face: 'down' },
    { from: '22:00', home: true },
  ],
  remnant: { prop: 'barrel' },
};
