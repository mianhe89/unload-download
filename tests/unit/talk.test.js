import { describe, it, expect } from 'vitest';
import { TALK } from '../../content/talk/talk.js';
import { characters } from '../../content/characters/index.js';
import { chapters } from '../../content/chapters/index.js';

describe('말 걸기 대화', () => {
  const phases = new Set(Object.values(chapters).flatMap((c) => Object.keys(c.phases)));
  it('인물과 페이즈 이름이 실제로 있다 (오타 방지)', () => {
    for (const [id, byPhase] of Object.entries(TALK)) {
      expect(characters[id], id).toBeTruthy();
      for (const ph of Object.keys(byPhase)) expect(phases.has(ph), `${id}.${ph}`).toBe(true);
    }
  });
  it('대화 한 묶음은 비어 있지 않고, 화자는 실제 인물이다', () => {
    const ctx = { isErased: () => false, flag: () => false, loads: () => 0, erasedCount: () => 0 };
    for (const [id, byPhase] of Object.entries(TALK)) for (const [ph, convs0] of Object.entries(byPhase)) for (const c of convs0.map((x) => (typeof x === 'function' ? x(ctx) : x))) {
      expect(c.length, `${id}.${ph}`).toBeGreaterThan(0);
      for (const line of c) if (Array.isArray(line) && line[0]) expect(line[0] === 'me' || characters[line[0]], `${id}.${ph}: ${line[0]}`).toBeTruthy();
    }
  });
});
