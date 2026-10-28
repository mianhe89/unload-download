// 마을 맵. 코드로 짓는다(사각형 배치). 1칸 = 16px.
// 바깥 3칸은 '흐릿한 가장자리'(안개)로, 걸어서 나갈 수 없다.
//
// 장소 이름(spots)은 대본·이벤트에서 좌표 대신 이름으로 부른다.

export const W = 48;
export const H = 34;
export const FOG = 3;

function build() {
  const g = Array.from({ length: H }, () => Array(W).fill('g'));
  const rect = (x, y, w, h, ch) => { for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) if (g[j]?.[i] !== undefined) g[j][i] = ch; };
  const house = (x, y, w, h, doorX) => { rect(x, y, w, 2, 'R'); rect(x, y + 2, w, h - 2, 'H'); if (doorX != null) g[y + h - 1][doorX] = 'D'; };

  // 안개와 숲 경계
  rect(0, 0, W, FOG, 'x'); rect(0, H - FOG, W, FOG, 'x'); rect(0, 0, FOG, H, 'x'); rect(W - FOG, 0, FOG, H, 'x');
  rect(FOG, FOG, W - FOG * 2, 1, 'T'); rect(FOG, H - FOG - 1, W - FOG * 2, 1, 'T');
  rect(FOG, FOG, 1, H - FOG * 2, 'T'); rect(W - FOG - 1, FOG, 1, H - FOG * 2, 'T');
  [[6, 6], [7, 8], [41, 7], [42, 26], [5, 18], [43, 15], [12, 29], [38, 29], [28, 5], [17, 30]].forEach(([x, y]) => { g[y][x] = 'T'; });

  // 길
  rect(5, 17, 38, 2, ',');       // 동서 큰길
  rect(23, 10, 2, 7, ',');       // 종탑 → 광장
  rect(8, 19, 2, 8, ',');        // 큰길 → 우물
  rect(36, 15, 2, 2, ',');       // 대장간 앞
  rect(36, 19, 2, 8, ',');       // 큰길 → 초소

  // 광장과 모닥불
  rect(17, 13, 14, 9, 'o');
  rect(23, 16, 2, 2, 'F');

  // 종탑
  rect(21, 5, 6, 5, 'B'); g[9][23] = 'b'; g[9][24] = 'b';

  // 빵집과 좌판
  house(8, 10, 6, 5, 11);
  rect(15, 15, 2, 1, 'S');

  // 꽃밭
  rect(26, 10, 5, 2, 'f');

  // 대장간
  house(33, 10, 6, 5, 36);
  g[16][39] = 'A';

  // 초소
  house(33, 23, 6, 4, 36);

  // 우물
  g[27][8] = 'W';

  // 민가
  house(13, 4, 5, 4, 15);
  house(30, 4, 5, 4, 32);
  house(14, 23, 6, 5, 16);
  house(24, 24, 6, 5, 26);

  return g.map((r) => r.join(''));
}

export const rows = build();

// 이름 붙은 장소 (타일 좌표)
export const spots = {
  plaza: { x: 24, y: 20 },
  fire: { x: 24, y: 17 },
  bakeryStall: { x: 16, y: 16 },
  flowerBed: { x: 28, y: 12 },
  smithyDoor: { x: 36, y: 15 },
  anvil: { x: 39, y: 16 },
  towerDoor: { x: 23.5, y: 10 },
  post: { x: 36, y: 27 },
  well: { x: 10, y: 28 },
  playerHome: { x: 16, y: 28 },
};

// 이벤트 구역 (타일 좌표 사각형)
export const zones = {
  smithy: { x: 34, y: 15, w: 5, h: 3 },
  tower: { x: 22, y: 10, w: 4, h: 2 },
  post: { x: 34, y: 27, w: 5, h: 3 },
  well: { x: 6, y: 25, w: 6, h: 5 },
};
