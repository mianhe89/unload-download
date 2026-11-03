// 고르드 — 서리 마을 여관 「곰의 굴」 주인. 곰 같은 덩치에 웃음이 크다. 습격이 끝나면 늘 국을 끓여 돌린다.
export default {
  id: 'gord',
  name: '고르드',
  role: '여관 주인',
  age: 51,
  color: '#d8a878',
  erasable: true,
  home: 'frost',
  // 필드 스프라이트: 'Inspector' 바탕(호르트와 같은 바탕)에 갈색 털가죽을 덧그렸다
  sprite: { base: 'Inspector', shareBase: 'hort', recolor: {}, edits: [{ type: 'cape', color: '6a4428', dark: '4a2e1a' }] },
  silhouette: '큰 덩치, 앞치마, 등에 갈색 털가죽.',
  bubbles: { frost: ['국 한 그릇 하고 가!', '남쪽에서 왔어? 거긴 아직 가을이라며?', '오크가 오면 문 걸고 숨어. 그게 이 마을 법이야.'] },
  schedule: [
    { from: '07:00', at: 'innDoor', face: 'down', say: ['문 열었다! 국 있다!'] },
    { from: '13:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '17:00', at: 'innDoor', face: 'down' },
    { from: '22:00', home: true },
  ],
  remnant: { prop: 'pot' },
};
