// 1장 도입 대본. 사라진 사람마다 빈자리를 따로 쓴다.
import { N, T, gone } from '../dsl.js';

export const script = {
  'aftermath.intro': [
    N('아침. 광장은 어제와 같았다.'),
    N('…같아야 했다.', { ifErasedAny: true }),
  ],

  'aftermath.mia': [
    T('mia', '…너, 또 그 얼굴이다. 아무도 없는 데를 보는 얼굴.'),
    N('빵 냄새가 나지 않았다. 광장 모퉁이는 처음부터 빈 터였다고, 미아가 말했다.', gone('hort')),
    N('초소 앞에 아무도 없었다. 이 마을은 원래 경비가 필요 없을 만큼 조용했다고 한다.', gone('tom')),
    N('광장 계단에 꽃이 없었다. 이 마을엔 꽃집이 없다고 한다.', gone('rine')),
    N('모닥불 자리에 류트 소리가 없었다. 마왕 노래를 아는 사람은 이제 없다.', gone('per')),
  ],

  'aftermath.tower': [
    N('종탑 벽에는 어젯밤 새긴 이름이 그대로 있었다. 에다.'),
    N('그 아래에, 이름이 하나 더 있었다.', { ifErasedAny: true }),
    N('호르트.', gone('hort')),
    N('톰.', gone('tom')),
    N('리네.', gone('rine')),
    N('페르.', gone('per')),
    N('내 글씨였다. 반지 테두리로 판 자국이었다.', { ifErasedAny: true }),
    N('나는 그걸 새긴 기억이 없다.', { ifErasedAny: true }),
    { fx: 'glitch', ifErasedAny: true },
    N('— 1장 「지워진 이름들」은 아직 쓰이지 않았다 —'),
    { end: 'title', next: { chapter: 'chapter1', phase: 'aftermath' } },
  ],

  'talk.aftermath.selena': [T('selena', '명부의 빈 줄이 늘었다. 너는 뭔가 알고 있지.')],
  'talk.aftermath.lu': [T('lu', '치우는 소리가 어젯밤보다 커졌어. 들려?')],
};
