import { describe, it, expect } from 'vitest';
import { MAP_ICONS, iconFor } from '../../content/art/mapIcons.js';
import * as village from '../../content/maps/village.js';

describe('작은 지도 건물 휘장', () => {
  it('그림은 모두 9×9이고 색표에 없는 글자를 쓰지 않는다', () => {
    for (const [id, { pal, rows }] of Object.entries(MAP_ICONS)) {
      expect(rows.length, id).toBe(9);
      for (const r of rows) {
        expect(r.length, `${id}: ${r}`).toBe(9);
        for (const ch of r) if (ch !== '.') expect(pal[ch], `${id}: ${ch}`).toBeDefined();
      }
    }
  });
  it('우리 마을의 가게·종탑엔 휘장이 붙고, 지워진 이름(빈 가게)엔 붙지 않는다', () => {
    const names = Object.fromEntries(village.objects.filter((o) => o.name).map((o) => [o.name, iconFor(o.name)]));
    expect(names['종탑']).toBe('bell');
    expect(names['호르트네 빵집']).toBe('bread');
    expect(names['에다의 대장간']).toBe('forge');
    expect(names['잡화점']).toBe('potion');
    expect(names['리네의 꽃집']).toBe('flower');
    expect(names['기사단 초소']).toBe('helmet');
    for (const v of Object.values(MAP_ICONS)) expect(v).toBeTruthy();
    expect(iconFor(null)).toBe(null);
  });
});
