// 레온 — 영주 기사단 정기사. 주인공의 라이벌. 잘생기고 유능하고 차갑다 (docs/스토리.md '라이벌')
// 1부 1장 6일에 초소로 온다. 공식 임무는 명부의 빈 줄 조사, 실제로는 숨겨진 왕국 왕의 명령으로 지워진 왕국의 공주를 찾는다
export default {
  id: 'leon',
  name: '레온',
  role: '영주 기사단 정기사',
  age: 23,
  color: '#e8d48a',
  erasable: false,
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Villager4'를 바탕으로 변형 (금발은 그대로, 붉은 옷을 검은 정기사 제복으로)
  // 셀레나도 같은 바탕이지만 은발·강철빛이라 실루엣 색으로 구별된다
  sprite: {
    base: 'Villager4',
    recolor: { d14b34: '2a2a3a', '8f3e56': '17172a' },
    edits: [{ type: 'cape' }], // 짙은 남색 망토: 셀레나와 같은 바탕이지만 실루엣이 갈린다
    shareBase: 'selena', // 바탕을 같이 쓴다는 표시 (실루엣은 덧그림으로 바꾼다)
  },
  silhouette: '뒤로 넘긴 금발과 검은 정기사 제복. 셀레나(은발·강철빛)와 같은 체구지만 색으로 갈린다.',
  bubbles: { aftermath: ['명부의 빈 줄이라…', '이 마을은 조용하군. 지나치게.', '(검집을 고쳐 찬다)'] },
  // 하루 일과. 6일에 도착(leon.arrived)한 뒤 초소에 산다. 아침 점호, 오전 순찰, 오후엔 마을 사람들에게 명부의 빈 줄을 묻고 다닌다.
  // 밤이면 초소 옆에서 혼자 검을 휘두른다(이름 대신 쓸모를 증명해야 하는 서자)
  // 2부: 소집으로 왕도에 가는 길에 함께 떠난다
  away: { ifFlag: 'ch4.departed' },
  schedule: [
    { from: '06:30', at: 'postYard', face: 'down', say: ['점호다. …아직 아무도 안 나왔군.'], when: { ifFlag: 'leon.arrived' } },
    { from: '10:00', at: 'plaza', mode: 'wander', radius: 3, say: ['순찰 중이다. 길을 비켜라.'], when: { ifFlag: 'leon.arrived' } },
    { from: '13:00', at: 'well', mode: 'wander', radius: 2, say: ['이 마을에서 사라진 사람을 아나? …모른다라. 다들 그렇게 말하더군.'], when: { ifFlag: 'leon.arrived' } },
    { from: '16:00', at: 'postYard', face: 'down', when: { ifFlag: 'leon.arrived' } },
    { from: '20:00', at: [40, 27], face: 'left', task: '(혼자 검을 휘두른다)', when: { ifFlag: 'leon.arrived' } },
    { from: '20:05', at: [40, 27], face: 'left', when: { ifFlag: 'leon.arrived' } },
    { from: '22:00', home: true, when: { ifFlag: 'leon.arrived' } },
  ],
  remnant: null,
};
