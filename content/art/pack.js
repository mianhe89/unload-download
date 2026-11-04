// Ninja Adventure 팩(CC0)에서 쓰는 그림의 목록. 원본은 assets-src/ninja-adventure/
// 좌표는 원본 시트의 픽셀. foot는 그림 왼쪽 위 기준의 충돌 사각형(px). foot가 없으면 지나갈 수 있다.
// 그림의 아래쪽 끝(y + h)이 깊이(앞뒤 순서)의 기준이라, 나무 뒤로 걸어가면 캐릭터가 가려진다.

export const SHEETS = {
  floor: 'Backgrounds/Tilesets/TilesetFloor.png',
  detail: 'Backgrounds/Tilesets/TilesetFloorDetail.png',
  house: 'Backgrounds/Tilesets/TilesetHouse.png',
  nature: 'Backgrounds/Tilesets/TilesetNature.png',
  element: 'Backgrounds/Tilesets/TilesetElement.png',
  water: 'Backgrounds/Tilesets/TilesetWater.png',
};

// 흙길 자동 타일: 바닥 시트의 '풀 위의 흙' 블록 (타일 좌표). 8×8 사분면 단위로 조합한다.
// 각 사분면은 이웃(가로·세로·대각)이 흙인지에 따라 바깥 모서리 / 가장자리 / 안쪽 모서리 / 가운데 중 하나가 된다.
export const DIRT = {
  sheet: 'floor',
  outer: { tl: [11, 7], tr: [13, 7], bl: [11, 9], br: [13, 9] },
  edge: { top: [12, 7], bottom: [12, 9], left: [11, 8], right: [13, 8] },
  center: [[12, 8]],
  // 흙 안쪽에 풀이 살짝 파고든 모서리 (그 사분면 위치에 풀이 있는 타일)
  inner: { tl: [17, 9], tr: [16, 9], bl: [17, 8], br: [16, 8] },
};

// 풀 바닥: 같은 블록 아래줄의 풀 타일들. 대부분 민무늬, 가끔 풀 무늬
export const GRASS = { sheet: 'floor', plain: [11, 12], variants: [[12, 12], [13, 12], [14, 12], [15, 12]] };

// 바닥 장식(밟고 지나감): 바닥 장식 시트의 풀포기·꽃
// 바닥 테마: 바닥 시트는 '땅 + 그 위의 길' 블록이 같은 배치로 반복된다.
// offset만큼 DIRT·GRASS 좌표를 옮기면 같은 자동 타일 규칙으로 눈길·모랫길을 그릴 수 있다.
// decor: 풀포기·들꽃을 얹을지 (눈·모래 위엔 얹지 않는다)
export const THEMES = {
  village: { offset: [0, 0], decor: true },                 // 짙은 풀 + 흙길 (마을)
  grass: { offset: [-11, 0], decor: true },                 // 밝은 풀 + 흙길
  snow: { offset: [-11, 7], decor: false },                 // 눈 + 다져진 눈길
  sand: { offset: [-11, -7], decor: false },                // 모래 + 모랫길
  earth: { offset: [0, 7], decor: false },                  // 마른 땅 + 흙길
  // tint: 바닥 위에 곱하기로 덮는 색 (팩에 따로 없는 땅을 만든다)
  cave: { offset: [0, 7], decor: false, tint: 'rgb(150,130,150)' },        // 갱도: 어두운 흙
  lava: { offset: [0, 7], decor: false, tint: 'rgb(255,120,70)' },          // 불의 산·용암 지대: 달궈진 땅
  void: { offset: [-11, 7], decor: false, tint: 'rgb(120,90,200)' },        // 은하: 보랏빛 바닥
  room: { offset: [0, 7], decor: false, tint: 'rgb(240,196,150)' },        // 집 안: 다져진 흙바닥에 등불 빛
  // water: 땅(g) 자리에 물을 깐다. 길(d)은 모래 자동 타일 = 물 위의 모래섬
  sea: { offset: [-11, -7], decor: false, water: { plain: [1, 1], variants: [[11, 1]] } },
};

export const DECOR = {
  tufts: [[0, 2], [1, 2], [2, 2], [3, 2], [6, 2]],
  flowers: [[5, 2], [7, 2]],
};

export const OBJECTS = {
  // ── 건물 (house 시트)
  house_orange: { sheet: 'house', rect: [0, 0, 64, 48], foot: [2, 18, 60, 30] },
  house_plain: { sheet: 'house', rect: [64, 0, 64, 48], foot: [2, 18, 60, 30] },
  house_red: { sheet: 'house', rect: [192, 0, 64, 48], foot: [2, 18, 60, 30] },
  bakery: { sheet: 'house', rect: [256, 0, 48, 48], foot: [1, 18, 46, 30] },
  shop: { sheet: 'house', rect: [304, 0, 64, 48], foot: [2, 18, 60, 30] },
  house_stone: { sheet: 'house', rect: [368, 0, 48, 48], foot: [2, 18, 44, 30] },
  house_wood: { sheet: 'house', rect: [416, 0, 48, 48], foot: [2, 18, 44, 30] },
  house_tall: { sheet: 'house', rect: [464, 0, 64, 64], foot: [2, 30, 60, 34] },
  forge: { sheet: 'house', rect: [464, 64, 48, 64], foot: [4, 30, 40, 34] },
  // 종탑: 큰 목조 회관을 바탕으로 박공 창에 종을 그려 넣은 변형본 (npm run assets가 만든다)
  belltower: { sheet: 'gen:belltower', rect: [0, 0, 64, 80], foot: [2, 40, 60, 40] },

  // ── 나무 (nature 시트). 줄기 한 칸만 막고 수관 아래로는 가려진다
  tree_round: { sheet: 'nature', rect: [256, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_round2: { sheet: 'nature', rect: [288, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_pine: { sheet: 'nature', rect: [32, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_dead: { sheet: 'nature', rect: [64, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_grove: { sheet: 'nature', rect: [256, 32, 64, 48], foot: [6, 34, 52, 14] },
  tree_grove2: { sheet: 'nature', rect: [320, 32, 64, 48], foot: [6, 34, 52, 14] },
  tree_pines: { sheet: 'nature', rect: [0, 32, 64, 48], foot: [6, 34, 52, 14] },
  tree_big: { sheet: 'nature', rect: [48, 288, 48, 48], foot: [16, 38, 16, 10] },
  tree_big_pink: { sheet: 'nature', rect: [0, 288, 48, 48], foot: [16, 38, 16, 10] },
  tree_big_autumn: { sheet: 'nature', rect: [144, 288, 48, 48], foot: [16, 38, 16, 10] },
  // 기후별 (길 맵에서 쓴다)
  tree_snow: { sheet: 'nature', rect: [128, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_snow2: { sheet: 'nature', rect: [160, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_snow_round: { sheet: 'nature', rect: [192, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_pink: { sheet: 'nature', rect: [224, 0, 32, 32], foot: [10, 24, 12, 8] },
  tree_grove_green: { sheet: 'nature', rect: [64, 32, 64, 48], foot: [6, 34, 52, 14] },
  tree_grove_snow: { sheet: 'nature', rect: [128, 32, 64, 48], foot: [6, 34, 52, 14] },
  pines_snow: { sheet: 'nature', rect: [64, 80, 64, 48], foot: [6, 34, 52, 14] },
  pines_snow2: { sheet: 'nature', rect: [128, 80, 64, 48], foot: [6, 34, 52, 14] },
  dead_grove: { sheet: 'nature', rect: [0, 80, 64, 48], foot: [6, 34, 52, 14] },
  rocks_brown: { sheet: 'nature', rect: [192, 80, 64, 48], foot: [4, 22, 56, 26] },
  rocks_grey: { sheet: 'nature', rect: [256, 80, 64, 48], foot: [4, 22, 56, 26] },
  bush: { sheet: 'nature', rect: [0, 160, 16, 16], foot: [2, 8, 12, 8] },
  bush2: { sheet: 'nature', rect: [16, 160, 16, 16], foot: [2, 8, 12, 8] },
  stump: { sheet: 'nature', rect: [128, 128, 16, 16], foot: [2, 6, 12, 10] },
  sunflower: { sheet: 'nature', rect: [0, 176, 16, 16] },
  flower_red: { sheet: 'nature', rect: [48, 176, 16, 16] },

  // ── 생활 소품 (element 시트)
  well: { sheet: 'element', rect: [96, 32, 16, 16], foot: [1, 4, 14, 12] },
  barrel: { sheet: 'element', rect: [0, 0, 16, 16], foot: [2, 6, 12, 10] },
  pot: { sheet: 'element', rect: [16, 0, 16, 16], foot: [2, 6, 12, 10] },
  crate: { sheet: 'element', rect: [96, 0, 16, 16], foot: [1, 4, 14, 12] },
  haystack: { sheet: 'element', rect: [192, 0, 16, 16], foot: [1, 6, 14, 10] },
  scarecrow: { sheet: 'element', rect: [240, 0, 16, 16], foot: [5, 10, 6, 6] },
  bench: { sheet: 'element', rect: [176, 16, 64, 16], foot: [2, 6, 60, 10] },
  clothesline: { sheet: 'element', rect: [192, 32, 64, 32], foot: [0, 24, 6, 8] },
  cart: { sheet: 'element', rect: [0, 48, 32, 32], foot: [2, 14, 28, 18] },
  // 길 맵의 살펴볼 거리와 층 사이 계단 (계단은 밟고 지나간다)
  signpost: { sheet: 'element', rect: [48, 32, 16, 16], foot: [5, 10, 6, 6] },
  runestone: { sheet: 'element', rect: [64, 32, 16, 16], foot: [2, 8, 12, 8] },
  runestone2: { sheet: 'element', rect: [80, 32, 16, 16], foot: [3, 8, 10, 8] },
  stairs_down: { sheet: 'element', rect: [96, 176, 16, 16] },
  stairs_down_stone: { sheet: 'element', rect: [144, 176, 16, 16] },
  stairs_up: { sheet: 'element', rect: [96, 192, 16, 16] },
  stairs_up_stone: { sheet: 'element', rect: [144, 192, 16, 16] },
  // 바다 (water 시트)
  boat: { sheet: 'water', rect: [416, 0, 32, 16], foot: [2, 4, 28, 10] },
  sea_rock: { sheet: 'water', rect: [384, 0, 16, 16], foot: [1, 2, 14, 13] },
};

// 움직이는 장식
export const ANIMATED = {
  flag_red: { src: 'Backgrounds/Animated/Flag/FlagRed16x16.png', frame: [16, 16], frames: 4, rate: 6 },
  flag_yellow: { src: 'Backgrounds/Animated/Flag/FlagYellow16x16.png', frame: [16, 16], frames: 4, rate: 6 },
  flag_blue: { src: 'Backgrounds/Animated/Flag/FlagBlue16x16.png', frame: [16, 16], frames: 4, rate: 6 },
  mill: { src: 'Backgrounds/Animated/MillPropeller/MillPropeller_A_64x64.png', frame: [64, 64], frames: 4, rate: 5 },
  smoke: { src: 'FX/Smoke/Smoke/SpriteSheet.png', frame: [32, 32], frames: 6, rate: 10 },
};

// 파티클 텍스처 (가로로 프레임이 늘어선 시트)
export const PARTICLES = {
  fire: { src: 'FX/Particle/Fire.png', frame: [12, 12] },
  leaf: { src: 'FX/Particle/Leaf.png', frame: [12, 7] },
  spark: { src: 'FX/Particle/Spark.png', frame: [10, 8] },
  leafPink: { src: 'FX/Particle/LeafPink.png', frame: [12, 7] },
  rain: { src: 'FX/Particle/Rain.png', frame: [8, 8] },
  snow: { src: 'FX/Particle/Snow.png', frame: [8, 8] },
};

export const SHADOW = 'Actor/Characters/Shadow.png';
export const FOG = 'FX/Environment/Fog.png';

// 캐릭터 스프라이트시트: 열 = 아래·위·왼쪽·오른쪽, 줄 = 걷기 4프레임(0~3), 공격, 점프, 기타
export const CHAR = { frame: 16, cols: 4, rows: 7, dirs: { down: 0, up: 1, left: 2, right: 3 }, walkRows: [0, 1, 2, 3] };
export const FACE = 38;

// 전투용 몬스터 그림 (팩 원본 그대로). frame: 한 칸 크기, frames: 대기 애니메이션 칸 수
// 일반 몬스터는 캐릭터처럼 열 = 방향(아래·위·왼·오), 줄 = 걷기 프레임 → 전투에선 왼쪽 보는 열을 쓴다
// 보스는 가로로 늘어선 대기 애니메이션
export const MONSTER_ART = {
  Slime: { src: 'Actor/Monsters/Slime/Slime.png', frame: [16, 16], kind: 'walker' },
  Beast: { src: 'Actor/Monsters/Beast/Beast.png', frame: [16, 16], kind: 'walker' },
  Owl: { src: 'Actor/Monsters/Owl/Owl.png', frame: [16, 16], kind: 'walker' },
  Mole: { src: 'Actor/Monsters/Mole/Mole.png', frame: [16, 16], kind: 'walker' },
  Skull: { src: 'Actor/Monsters/Skull/SpriteSheet.png', frame: [16, 16], kind: 'walker' },
  GiantSpirit: { src: 'Actor/Boss/GiantSpirit/Idle.png', frame: [50, 50], kind: 'idle', frames: 5 },
  // 까마귀(마스코트): 올빼미를 검게 칠했다. 몬스터가 아니라 종탑 위에 앉아 주인공을 지켜보는 새다
  Crow: { src: 'Actor/Monsters/Owl/Owl.png', frame: [16, 16], kind: 'walker', recolor: { fce2ca: '4a4a5a', ffad5d: 'b8b8c4', d14b34: '22222c', '8d977f': '3c3c4a' } },
};
