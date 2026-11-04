// 우리 집 안 (16×12칸). 광장 남쪽, 주인공이 혼자 사는 작은 집. 우리 마을의 문(doors)으로 들어온다.
// 다져진 흙바닥에 깔개, 침대, 책장, 서랍장, 식탁, 화분, 솥, 궤짝(팩의 TilesetElement 가구). 받은 물건이 선반에 쌓이고, 준 사람이 지워지면 먼지 자국만 남는다(docs/스토리.md '주인공의 집').
// 잠자리에서 E: 밤엔 자고 다음 날 아침, 낮엔 눈을 붙여 피로를 푼다. 식탁에서 E: 집밥.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'myhome', name: '우리 집', W: 16, H: 12, FOG: 1, theme: 'room', fogColor: '26,18,14',
  objects: [
    O('rug', 5, 4),                                    // 가운데 깔개 (밟고 지나간다)
    O('bed', 2, 2),                                    // 침대
    O('bookshelf', 5, 1), O('bookshelf_wide', 7, 1),   // 뒷벽의 책장
    O('drawers', 11, 2),                               // 서랍장
    O('table_small', 8, 6),                            // 식탁
    O('plant_pot', 13, 7), O('pot', 12, 6), O('barrel', 13, 4), O('crate', 2, 8),
  ],
  exits: [{ dir: 's', from: 7, to2: 9, back: true }], // 문: 나가면 마을의 문 앞
  entry: { s: [7, 9] },
  spots: { bed: { x: 3, y: 3 }, table: { x: 8.5, y: 7 }, shelf: { x: 11, y: 4 } },
  zones: {},
  life: [
    { action: 'sleep', at: [3, 3] },
    { action: 'homeMeal', at: [9, 7] },
  ],
  // 받은 물건 (준 사람이 지워지면 먼지 자국)
  props: [
    { prop: 'crown', at: [11, 4], when: { ifFlag: 'has.crown', unlessErased: 'rine' }, text: '리네가 짜 준 화관. 서랍장 위에 두었다. 꽃이 조금 시들었다.' },
    { prop: 'dust', at: [11, 4], when: { ifFlag: 'has.crown', ifErased: 'rine' }, text: '서랍장 위에 동그란 먼지 자국. 여기 뭘 올려 뒀더라. 꽃 같은 걸.' },
    { prop: 'basket', at: [7, 7], when: { ifFlag: 'ev.prep.hort', unlessErased: 'hort' }, text: '호르트 아저씨가 빵을 담아 준 바구니. 꿀 냄새가 아직 난다.' },
    { prop: 'dust', at: [7, 7], when: { ifFlag: 'ev.prep.hort', ifErased: 'hort' }, text: '식탁 옆에 둥근 자국. 바구니 같은 게 있었던 것 같다. 누구 거였지.' },
    { prop: 'lute', at: [3, 6], when: { ifFlag: 'per.verse.heard', unlessErased: 'per' }, text: '페르 할아버지가 빌려준 낡은 류트. 줄 하나가 늘 반음 낮다.' },
  ],
  lights: [{ spot: 'table', radius: 80, flicker: true }],
});
