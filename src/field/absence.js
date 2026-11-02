// 빈자리 찾기 (순수 함수). 1장부터, 지워진 사람이 있던 자리에는 흔적이 남는다.
// 흔적을 살펴보면 found.<id> 플래그가 켜지고, 목표 옆에 '빈자리 n/m'이 붙는다.
// 강제는 아니다. 다 돌아본 사람에게만 종탑에서 한 줄이 더 보인다(found.all).
export function absence(erasedIds, remnantIds, flags) {
  const targets = erasedIds.filter((id) => remnantIds.includes(id));
  const found = targets.filter((id) => flags[`found.${id}`]).length;
  return { total: targets.length, found, all: targets.length > 0 && found === targets.length };
}

export function objectiveText(base, { total, found }) {
  if (!total) return base;
  return base ? `${base} · 빈자리 ${found}/${total}` : `빈자리 ${found}/${total}`;
}
