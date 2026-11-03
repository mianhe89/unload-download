// 호감도에 따라 바뀌는 일러스트의 규칙. 그림 파일 목록은 content/cg.js 의 PORTRAITS 에 적는다.
//   PORTRAITS.<인물>.stages = { warm: { file, faces }, close: {...}, love: {...} }  (base는 file·faces 그대로)
// 단계가 오르면 옷차림·거리감·표정의 결이 달라진다. 없는 단계는 아래 단계 그림을 쓴다.

export const STAGES = [
  { id: 'base', min: -Infinity, desc: '처음 — 업무적인 거리, 정돈된 차림' },
  { id: 'warm', min: 10, desc: '익숙함 — 경계가 풀리고 표정이 부드럽다' },
  { id: 'close', min: 25, desc: '가까움 — 사적인 차림, 먼저 웃는다' },
  { id: 'love', min: 50, desc: '특별함 — 이 사람에게만 보이는 얼굴' },
];

// 표정 이름 (대사의 [mood=..] 또는 T(인물, 말, { face })). 같은 뜻의 다른 이름은 ALIAS로 맞춘다
export const MOODS = ['neutral', 'happy', 'shy', 'sad', 'angry', 'surprised', 'hurt'];
export const MOOD_ALIAS = { smile: 'happy', laugh: 'happy' };

// 호감도로 그림이 바뀌는 인물 (히로인). 말 걸기 대화를 처음 들으면 호감도가 오른다
export const HEROINES = ['mia', 'selena', 'lu', 'eda', 'rine', 'elf'];

// 적 일러스트 (전투 시작·보스 컷인): content/cg.js 의 ENEMY_PORTRAITS 에 { 몬스터: 파일 } 로 적는다
