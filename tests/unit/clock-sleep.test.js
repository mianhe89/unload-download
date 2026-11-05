import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMemory } from '../../src/core/world/WorldMemory.js';
import { Clock, SLEEP_MINUTES } from '../../src/field/systems/Clock.js';
import { freshWorld } from '../helpers/world.js';

describe('잠: 한 번 자면 12시간', () => {
  beforeEach(async () => { await freshWorld(); WorldMemory.startNew(); WorldMemory.setTime({ day: 4, minute: 22 * 60 }); });
  it('밤 10시에 자면 다음 날 아침 10시, 날이 바뀐다', () => {
    const c = new Clock({ phase: { clock: true } });
    expect(SLEEP_MINUTES).toBe(720);
    expect(c.sleepFor()).toBe(true);
    expect([c.day, c.hhmm]).toEqual([5, '10:00']);
  });
  it('아침 8시에 자면 같은 날 저녁 8시', () => {
    WorldMemory.setTime({ day: 4, minute: 8 * 60 });
    const c = new Clock({ phase: { clock: true } });
    expect(c.sleepFor()).toBe(false);
    expect([c.day, c.hhmm]).toEqual([4, '20:00']);
  });
});
