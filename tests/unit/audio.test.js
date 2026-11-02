// 소리 목록: 원본이 있고, 모든 페이즈·기후에 음악이 붙어 있다
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MUSIC, SFX, PHASE_MUSIC, BIOME_MUSIC, BIOME_AMBIENT, HUB_MUSIC } from '../../content/audio/audio.js';
import { chapters } from '../../content/chapters/index.js';
import { BIOMES, HUBS } from '../../content/world/world.js';

const SRC = join(import.meta.dirname, '../../assets-src/ninja-adventure/Audio');

describe('소리 목록', () => {
  it('음악·효과음 원본이 모두 있다', () => {
    for (const v of Object.values(MUSIC)) expect(existsSync(join(SRC, v)), v).toBe(true);
    for (const v of Object.values(SFX)) expect(existsSync(join(SRC, v.src)), v.src).toBe(true);
  });
  it('모든 이야기 페이즈에 음악이 있다', () => {
    for (const ch of Object.values(chapters)) for (const id of Object.keys(ch.phases)) expect(MUSIC[PHASE_MUSIC[id]], id).toBeTruthy();
  });
  it('모든 기후에 음악이 있다 (깔리는 소리는 있는 것만)', () => {
    for (const b of Object.keys(BIOMES)) expect(MUSIC[BIOME_MUSIC[b]], b).toBeTruthy();
    for (const k of Object.values(BIOME_AMBIENT)) expect(SFX[k]?.loop, k).toBe(true);
  });
  it('거점 음악은 실제 거점과 곡을 가리킨다', () => {
    for (const [h, k] of Object.entries(HUB_MUSIC)) { expect(HUBS[h], h).toBeTruthy(); expect(MUSIC[k], k).toBeTruthy(); }
  });
  it('전투 음악과 결과 소리가 있다', () => {
    for (const k of ['battle', 'boss', 'title']) expect(MUSIC[k]).toBeTruthy();
    for (const k of ['hit', 'heavy', 'tell', 'win', 'lose', 'bell', 'secret']) expect(SFX[k]).toBeTruthy();
  });
});
