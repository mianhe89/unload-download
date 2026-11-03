// 이벤트 CG와 인물 일러스트.
// CG: 중요한 장면에서 화면을 덮는 그림. 대본에서 { cg: 'id', tint? }로 띄우고 { cg: null }로 내린다(컷신이 끝나도 내려간다).
//     인물 CG는 파일 대신 bg(배경 CG id)와 figure(인물 일러스트 id)를 적어, 배경 위에 그 인물을 세운다.
// 그림은 public/assets/cg/. 지금 배경 그림은 전부 임시(placeholder)다. 출처는 CREDITS.md.
//
// tint: 낮 그림을 밤·노을로 돌려 쓸 때. color는 그림에 곱하는 색, dim은 위에 덮는 어둠(0~1)
export const TINTS = {
  dusk: { color: 0xffc49a },
  night: { color: 0x7a88c8, dim: 0.55 },
  cold: { color: 0xa8acb8, dim: 0.2 },
};

export const CG = {
  festival: { file: 'cg/festival.jpg', temp: true },
  morning: { file: 'cg/morning.jpg', temp: true },
  smithy: { file: 'cg/smithy.jpg', temp: true },
  tower: { file: 'cg/tower.jpg', temp: true },
  aftermath: { file: 'cg/aftermath.jpg', temp: true },

  // 인물 CG
  'mia.fire': { bg: 'festival', figure: 'mia' },
};

// 인물 일러스트. 진짜 그림이 있는 인물만 적는다(말할 때 대화창 오른쪽 뒤에 선다).
// 그림이 없는 인물은 대화창의 작은 도트 얼굴(public/assets/gen/face)을 쓴다. 코드로 그린 임시 일러스트는 쓰지 않는다.
// 파일은 인물마다 폴더 하나: public/assets/characters/<사는 곳>/<인물id>/ (portrait = 기본 얼굴, 그 밖의 파일은 표정)
// faces: 표정 차분 { 표정: 파일 }. 대사에 T(인물, 문장, { face: '표정' })로 고른다. 없으면 file
const V = 'characters/village';
export const PORTRAITS = {
  mia: { file: `${V}/mia/portrait.webp`, faces: { happy: `${V}/mia/happy.webp`, shy: `${V}/mia/shy.webp` } },
};
