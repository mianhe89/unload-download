// 콘텐츠 전체 검증 + 이야기를 '논리 수준'에서 끝까지 플레이해 보는 시뮬레이션.
// 브라우저 없이 모든 지워짐 조합으로 프롤로그를 완주할 수 있는지 확인한다.
import { describe, it, expect } from 'vitest';
import { validateContent } from '../../tools/lib/validateContent.mjs';
import { chapters } from '../../content/chapters/index.js';
import { characters } from '../../content/characters/index.js';
import * as village from '../../content/maps/village.js';
import { ScriptRunner, passes } from '../../src/core/script/ScriptRunner.js';
import { EventDirector } from '../../src/field/EventDirector.js';

describe('콘텐츠 검증', () => {
  it('대본·페이즈·캐릭터·맵에 문제가 없다', () => {
    const { errors } = validateContent();
    expect(errors).toEqual([]);
  });
});

const TILE = 16;
const ERASABLE = Object.values(characters).filter((c) => c.erasable).map((c) => c.id);

// 한 장을 처음부터 끝까지 '봇'이 플레이한다.
// 봇은 아직 안 일어난 이벤트의 목표(인물·구역·물건)로 순간이동하고, 컷신은 즉시 넘긴다.
function playChapter(chapterId, erased, { maxSeconds = 900 } = {}) {
  const ch = chapters[chapterId];
  const flags = {};
  const aff = {};
  const log = [];
  let phaseId = ch.firstPhase;
  let ended = null;

  while (!ended) {
    const ph = ch.phases[phaseId];
    const ctx = {
      isErased: (id) => erased.includes(id), erasedCount: () => erased.length, loads: () => erased.length,
      flag: (n) => flags[n], setFlag: (n) => { flags[n] = true; flagTimes[n] = time; }, addAffinity: (id, n) => { aff[id] = (aff[id] ?? 0) + n; },
    };
    const flagTimes = {};
    const people = {};
    for (const [id, cfg] of Object.entries(ph.npcs ?? {})) {
      if (cfg.when && !passes(cfg.when, ctx)) continue;
      if (!erased.includes(id)) people[id] = cfg.at;
    }
    const picked = {};
    const pickups = {};
    let time = 0;
    let next = null;
    const player = { x: ph.player.at[0] * TILE, y: ph.player.at[1] * TILE, idleTime: 0 };
    let zone = null;

    const runner = new ScriptRunner(ch.script, ctx);
    const play = (label) => {
      log.push(`${phaseId}:${label}`);
      runner.start(label);
      for (let n = runner.next(); !n.done; n = runner.next()) {
        if (n.act === 'spawnNpc') people[n.id] = n.at ?? [Math.round(player.x / TILE) + n.offset[0], Math.round(player.y / TILE) + n.offset[1]];
        if (n.act === 'despawn' || n.act === 'walkAway') delete people[n.id];
        if (n.act === 'spawnPickups') pickups[n.group] = n.items;
        if (n.phase) { next = { phase: n.phase }; return; }
        if (n.end) { next = { end: n.next }; return; }
      }
    };
    if (ph.onEnter) play(ph.onEnter);

    const director = new EventDirector(ph.events ?? []);
    const world = () => ({
      time, player,
      pos: (name) => (people[name] ? { x: people[name][0] * TILE, y: people[name][1] * TILE } : village.spots[name] ? { x: village.spots[name].x * TILE, y: village.spots[name].y * TILE } : null),
      inZone: (z) => zone === z,
      pickedAll: (g) => Boolean(picked[g]),
      flag: (n) => flags[n], flagTime: (n) => flagTimes[n], passes: (w) => passes(w, ctx),
    });

    // 봇의 목표: 아직 안 일어난 이벤트 중 조건이 맞는 것 하나
    const goTo = (ev) => {
      const t = ev.trigger;
      zone = null;
      const toTile = (name) => {
        const p = people[name] ?? (village.spots[name] && [village.spots[name].x, village.spots[name].y]);
        if (p) { player.x = p[0] * TILE; player.y = (p[1] + 1) * TILE; }
      };
      if (t.zone) zone = t.zone;
      if (t.pickedAll && pickups[t.pickedAll]) picked[t.pickedAll] = true;
      if (t.near) toTile(t.near);
      if (t.dwell) toTile(t.dwell);
      player.idleTime = 99;
    };

    while (!next && time < maxSeconds) {
      const pending = director.events.find((e) => !e.fired && (!e.when || passes(e.when, ctx)));
      if (pending) goTo(pending);
      const { runs } = director.update(0.5, world(), false);
      for (const r of runs) { flags[`done.${r.id}`] = true; play(r.run); if (next) break; }
      time += 0.5;
    }
    if (!next) return { stuck: phaseId, log, flags };
    if (next.end) ended = next.end;
    else phaseId = next.phase;
  }
  return { ended, log, flags, aff };
}

describe('논리 플레이스루 (모든 지워짐 조합)', () => {
  const combos = [];
  for (let mask = 0; mask < 1 << ERASABLE.length; mask += 1) combos.push(ERASABLE.filter((_, k) => mask & (1 << k)));

  it.each(combos.map((c) => [c.join(',') || '없음', c]))('프롤로그를 끝까지 갈 수 있다 — 지워짐: %s', (_, erased) => {
    const r = playChapter('prologue', erased);
    expect(r.stuck, `막힌 곳: ${r.stuck}\n${r.log.join('\n')}`).toBeUndefined();
    expect(r.ended).toEqual({ chapter: 'chapter1', phase: 'aftermath' });
    expect(r.flags['eda.met']).toBe(true);
  });

  it('지워진 사람의 이벤트는 일어나지 않는다', () => {
    const r = playChapter('prologue', ['hort']);
    expect(r.log.some((l) => l.includes('hort_spill'))).toBe(false);
  });

  it('아무도 안 지워졌으면 마을 사람 이벤트를 모두 겪을 수 있다', () => {
    const r = playChapter('prologue', []);
    for (const f of ['ev.hort', 'ev.tom', 'ev.rine', 'ev.per']) expect(r.flags[f], f).toBe(true);
  });

  it('1장 도입도 끝까지 간다 (1명 이상 지워진 상태)', () => {
    const r = playChapter('chapter1', ['hort']);
    expect(r.stuck).toBeUndefined();
    expect(r.ended).toBeDefined();
  });
});
