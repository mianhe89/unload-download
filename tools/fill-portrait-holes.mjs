// 일러스트(배경을 지운 PNG)의 '안쪽 구멍'을 메운다. 배경 지우기가 속눈썹·머리카락 같은 가는 선을 반투명하게 남겨,
// 대화창 뒤의 풀밭이 비쳐 초록빛으로 보이던 것을 고친다.
// 바깥 가장자리에서 투명한 칸을 따라 닿는 곳은 진짜 배경이라 두고, 거기 닿지 않는 반투명 칸만 불투명하게 한다.
// 사용: node tools/fill-portrait-holes.mjs 입력.png 출력.png
import { readPng, writePng } from './lib/pixels.mjs';

const [src, dst] = process.argv.slice(2);
const img = readPng(src);
const { width: W, height: H, data } = img;
const outside = new Uint8Array(W * H);
const q = [];
const push = (i) => { if (!outside[i] && data[i * 4 + 3] < 16) { outside[i] = 1; q.push(i); } };
for (let x = 0; x < W; x += 1) { push(x); push((H - 1) * W + x); }
for (let y = 0; y < H; y += 1) { push(y * W); push(y * W + W - 1); }
while (q.length) {
  const i = q.pop(), x = i % W, y = (i / W) | 0;
  if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W);
}
let fixed = 0;
for (let i = 0; i < W * H; i += 1) {
  if (outside[i] || data[i * 4 + 3] >= 250) continue;
  // 거의 투명한 안쪽 칸은 이웃의 색을 빌려 온다(색 정보가 없을 수 있다)
  if (data[i * 4 + 3] < 16) {
    let r = 0, g = 0, b = 0, n = 0;
    for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < W * H && data[j * 4 + 3] > 200) { r += data[j * 4]; g += data[j * 4 + 1]; b += data[j * 4 + 2]; n += 1; }
    if (n) { data[i * 4] = r / n; data[i * 4 + 1] = g / n; data[i * 4 + 2] = b / n; }
  }
  data[i * 4 + 3] = 255;
  fixed += 1;
}
writePng(dst, img);
console.log(`${src}: 안쪽 구멍 ${fixed}칸 메움`);
