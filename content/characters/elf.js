// 엘프 — 숲의 사람 (숲을 지키며 지낸 사람만 만난다)
export default {
  id: 'elf',
  name: '엘프',
  role: '숲의 사람',
  color: '#a8e0a0',
  erasable: false,
  background: true,
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Cavegirl'을 바탕으로 변형 (잎사귀 머리는 그대로, 붉은 옷을 연두빛 망토로, 피부를 밝게)
  sprite: {
    base: 'Cavegirl',
    recolor: { d14b34: '7ab86a', '965340': '4e7a44', ef914f: 'f6c8a0', a3754e: 'c99a78' },
    edits: [],
  },
  bubbles: {},
  remnant: null,
};
