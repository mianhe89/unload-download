// 흙길 자동 타일: 8×8 사분면 하나에 어떤 조각을 쓸지 고른다 (순수 함수, 테스트 가능)
// isDirt(x, y) → 그 칸이 흙인가. qx, qy: 0 = 왼쪽/위, 1 = 오른쪽/아래
// 돌려주는 값: { kind: 'center' | 'inner' | 'edge' | 'outer', key }
export function dirtQuarter(isDirt, x, y, qx, qy) {
  const hx = qx ? 1 : -1, vy = qy ? 1 : -1;
  const h = isDirt(x + hx, y), v = isDirt(x, y + vy), d = isDirt(x + hx, y + vy);
  const corner = (qy ? 'b' : 't') + (qx ? 'r' : 'l');
  if (h && v) return d ? { kind: 'center' } : { kind: 'inner', key: corner };
  if (h) return { kind: 'edge', key: qy ? 'bottom' : 'top' };
  if (v) return { kind: 'edge', key: qx ? 'right' : 'left' };
  return { kind: 'outer', key: corner };
}
