import { describe, it, expect } from 'vitest';
import { ANIMALS, SPECIES_INFO } from '../../content/animals.js';
import { SPECIES, animalPixels } from '../../content/art/animals.js';
import { MAPS } from '../../content/maps/index.js';
import { ITEMS } from '../../content/items.js';

describe('마을 동물', () => {
  it('그림은 16×16 두 장, 모든 줄이 16칸', async () => {
    for (const sp of SPECIES) for (const f of [0, 1]) expect(animalPixels(sp, f).length).toBe(16 * 16 * 4);
  });
  it('배치: 그 맵이 있고, 종이 있고, 걸을 수 있는 칸, 좋아하는 먹이는 가방 아이템', () => {
    for (const [mid, list] of Object.entries(ANIMALS)) {
      const m = MAPS[mid];
      expect(m, mid).toBeTruthy();
      for (const a of list) {
        expect(SPECIES_INFO[a.species] && SPECIES.includes(a.species), `${mid}/${a.id}`).toBe(true);
        expect(m.isSolidTile(...a.at), `${mid}/${a.id} ${a.at}`).toBe(false);
      }
    }
    for (const s of Object.values(SPECIES_INFO)) for (const it of s.likes) expect(ITEMS[it], it).toBeTruthy();
  });
});
