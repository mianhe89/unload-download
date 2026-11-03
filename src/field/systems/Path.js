// 타일 길찾기(A*). 인물이 일과를 따라 장소를 옮길 때 건물·나무를 돌아서 걷는다.
// isSolid(tx, ty) → 막힌 칸. 돌려주는 값: [[tx, ty], ...] (출발 칸 제외, 도착 칸 포함) 또는 null
export function findPath(isSolid, from, to, { cols, rows, limit = 4000 } = {}) {
  const key = (x, y) => y * cols + x;
  const [sx, sy] = from, [gx, gy] = to;
  if (isSolid(gx, gy)) return null;
  const open = [[sx, sy]];
  const g = new Map([[key(sx, sy), 0]]);
  const f = new Map([[key(sx, sy), Math.abs(gx - sx) + Math.abs(gy - sy)]]);
  const came = new Map();
  let steps = 0;
  while (open.length && steps < limit) {
    steps += 1;
    let bi = 0;
    for (let i = 1; i < open.length; i += 1) if (f.get(key(...open[i])) < f.get(key(...open[bi]))) bi = i;
    const [x, y] = open.splice(bi, 1)[0];
    if (x === gx && y === gy) {
      const path = [];
      let k = key(x, y);
      while (came.has(k)) { path.unshift([k % cols, Math.floor(k / cols)]); k = came.get(k); }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || isSolid(nx, ny)) continue;
      const nk = key(nx, ny), ng = g.get(key(x, y)) + 1;
      if (ng >= (g.get(nk) ?? Infinity)) continue;
      came.set(nk, key(x, y));
      g.set(nk, ng);
      f.set(nk, ng + Math.abs(gx - nx) + Math.abs(gy - ny));
      if (!open.some(([ox, oy]) => ox === nx && oy === ny)) open.push([nx, ny]);
    }
  }
  return null;
}

// 꺾이는 곳만 남겨 걷는 모양을 부드럽게
export function simplify(path) {
  if (!path || path.length < 3) return path;
  const out = [path[0]];
  for (let i = 1; i < path.length - 1; i += 1) {
    const [ax, ay] = out[out.length - 1], [bx, by] = path[i], [cx, cy] = path[i + 1];
    if ((bx - ax) * (cy - by) !== (by - ay) * (cx - bx)) out.push(path[i]);
  }
  out.push(path[path.length - 1]);
  return out;
}
