import { describe, it, expect } from 'vitest';
import { ICON_IDS, iconPixels } from '../../content/art/icons.js';
import { ITEMS } from '../../content/items.js';

describe('아이템 그림', () => {
  it('모든 아이템에 그림이 있다', () => { for (const id of Object.keys(ITEMS)) expect(ICON_IDS, id).toContain(id); });
  it('그림은 16×16', () => { for (const id of ICON_IDS) expect(iconPixels(id).length).toBe(16 * 16 * 4); });
});
