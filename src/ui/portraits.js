// 일러스트 고르기 (순수 함수). 텍스처 키는 BootScene이 content/cg.js 대로 싣는다:
//   portrait.<인물>           기본 얼굴         portrait.<인물>.<표정>
//   portrait.<인물>@<단계>    호감도 단계 그림  portrait.<인물>@<단계>.<표정>
import { STAGES, MOOD_ALIAS, HEROINES } from '../../content/portraits/portraits.js';

export function stageOf(id, affinity = 0) {
  if (!HEROINES.includes(id)) return 'base';
  let st = 'base';
  for (const s of STAGES) if (affinity >= s.min) st = s.id;
  return st;
}

// has(key) → 그 텍스처가 있나. 위 단계부터 아래로, 표정 → 기본 얼굴 순서로 찾는다. 하나도 없으면 null
export function portraitKey(id, { mood = null, affinity = 0 } = {}, has = () => false) {
  if (!id) return null;
  const m = mood ? (MOOD_ALIAS[mood] ?? mood) : null;
  const ids = STAGES.map((s) => s.id);
  const from = ids.indexOf(stageOf(id, affinity));
  const tries = [];
  for (let i = from; i >= 1; i -= 1) { if (m) tries.push(`portrait.${id}@${ids[i]}.${m}`); tries.push(`portrait.${id}@${ids[i]}`); }
  if (m) tries.push(`portrait.${id}.${m}`);
  tries.push(`portrait.${id}`);
  return tries.find(has) ?? null;
}
