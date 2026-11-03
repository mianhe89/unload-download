// 콘텐츠 전체 검증 + 이야기를 '논리 수준'에서 끝까지 플레이해 보는 시뮬레이션.
// 브라우저 없이 모든 지워짐 조합으로 프롤로그를 완주할 수 있는지 확인한다.
import { describe, it, expect } from 'vitest';
import { validateContent } from '../../tools/lib/validateContent.mjs';
import { chapters } from '../../content/chapters/index.js';
import { characters } from '../../content/characters/index.js';
import * as village from '../../content/maps/village.js';
import { mapOf } from '../../content/maps/index.js';
import { ScriptRunner, passes } from '../../src/core/script/ScriptRunner.js';
import { EventDirector } from '../../src/field/EventDirector.js';
import { QUESTS } from '../../content/quests/index.js';
import { BOSSES } from '../../content/battles/encounters.js';

describe('콘텐츠 검증', () => {
  it('대본·페이즈·캐릭터·맵에 문제가 없다', () => {
    const { errors } = validateContent();
    expect(errors).toEqual([]);
  });
});

const TILE = 16;
// 지워짐 조합은 우리 마을 사람만 (다른 마을 사람은 그 마을 페이즈에만 나온다)
const ERASABLE = Object.values(characters).filter((c) => c.erasable && (c.home ?? 'village') === 'village').map((c) => c.id);

// 한 장을 처음부터 끝까지 '봇'이 플레이한다.
// 봇은 아직 안 일어난 이벤트의 목표(인물·구역·물건)로 순간이동하고, 컷신은 즉시 넘긴다.
function playChapter(chapterId, erased, { maxSeconds = 900, flags: startFlags = {} } = {}) {
  const ch = chapters[chapterId];
  const flags = { ...startFlags };
  const aff = {};
  const log = [];
  const quests = {};
  const clock = { day: 1, minute: 9 * 60 };
  let phaseId = ch.firstPhase;
  let ended = null;
  const entered = new Set();   // 처음 들어선 페이즈 (날짜·시각은 처음에만 맞춘다, onEnter도 처음에만)
  let returnTo = null;         // 다른 마을(visit 페이즈)에 들렀다 돌아갈 페이즈
  const visitedOn = {};        // 그날 이미 들른 마을

  while (!ended) {
    const ph = ch.phases[phaseId];
    const ctx = {
      isErased: (id) => erased.includes(id), erasedCount: () => erased.length, loads: () => erased.length,
      flag: (n) => flags[n], setFlag: (n) => { flags[n] = true; flagTimes[n] = time; }, addAffinity: (id, n) => { aff[id] = (aff[id] ?? 0) + n; },
      minute: () => clock.minute, day: () => clock.day, quest: (id) => quests[id],
    };
    const first = !entered.has(phaseId);
    entered.add(phaseId);
    if (first && !ph.keepTime) { if (ph.day != null) clock.day = ph.day; clock.minute = 9 * 60; }
    const flagTimes = {};
    const people = {};
    for (const [id, cfg] of Object.entries(ph.npcs ?? {})) {
      if (cfg.when && !passes(cfg.when, ctx)) continue;
      if (!erased.includes(id)) people[id] = cfg.at;
    }
    // 시계가 도는 날: 배치되지 않은 사람은 하루 일과대로 (그날 시작 시각에 있는 자리)
    if (ph.clock) {
      const start = 9 * 60;
      const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      for (const c of Object.values(characters)) {
        if (!c.schedule || ph.npcs?.[c.id] || erased.includes(c.id)) continue;
        if ((c.home ?? 'village') !== (mapOf(ph).id ?? 'village')) continue; // 다른 마을 사람
        const list = c.schedule.filter((e) => !e.when || passes(e.when, ctx));
        let cur = list.at(-1);
        for (const e of list) if (mins(e.from) <= start) cur = e;
        if (!cur || cur.home) continue;
        const sp = mapOf(ph).spots;
        people[c.id] = Array.isArray(cur.at) ? cur.at : [sp[cur.at].x, sp[cur.at].y];
      }
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
        if (n.act === 'battle' && n.flag) ctx.setFlag(n.flag); // 전투는 이긴 것으로 (이길 수 있는지는 battle.test가 지킨다)
        if (n.phase) { next = { phase: n.phase }; return; }
        if (n.end) { next = { end: n.next }; return; }
      }
    };
    if (ph.onEnter && first) play(ph.onEnter);

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
      player.running = Boolean(t.running); // 뛰어야 켜지는 계기면 뛰어서 간다
    };

    // 퀘스트: 조건이 맞으면 저절로 시작하고, 지금 단계의 일을 한다(말 걸기·구역·시각). 맞으면 다음 단계로
    const questStep = () => {
      for (const [id, def] of Object.entries(QUESTS)) {
        if (!quests[id] && def.start?.auto && (!def.start.when || passes(def.start.when, ctx))) quests[id] = { state: 'active', step: 0 };
        const q = quests[id];
        if (q?.state !== 'active') continue;
        const st = def.steps[q.step];
        const d = st.done;
        if (d.talk && !people[d.talk]) continue;
        if (d.when?.afterTime) clock.minute = Math.max(clock.minute, Number(d.when.afterTime.slice(0, 2)) * 60 + Number(d.when.afterTime.slice(3)));
        const ok = (!d.flag || flags[d.flag]) && (!d.when || passes(d.when, ctx));
        if (!ok) continue;
        if (st.onDone) play(st.onDone);
        log.push(`퀘스트 ${id} ${q.step + 1}단계`);
        if (q.step + 1 < def.steps.length) q.step += 1; else q.state = 'done';
        return true;
      }
      return false;
    };
    let idle = 0;
    while (!next && time < maxSeconds) {
      const pending = director.events.find((e) => !e.fired && (!e.when || passes(e.when, ctx)));
      if (pending) goTo(pending);
      const { runs } = director.update(0.5, world(), false);
      for (const r of runs) { flags[`done.${r.id}`] = true; play(r.run); if (next) break; }
      if (!next && questStep()) idle = 0;
      // 시계가 도는 날: 일어날 일이 없으면 다음 날 아침으로 (잠)
      if (ph.clock && !next && !runs.length && (idle += 1) > 20) {
        idle = 0;
        // 길의 보스: 나타날 조건이 맞으면 찾아가서 이긴 것으로 (전투는 battle.test가 지킨다)
        const boss = Object.values(BOSSES).find((b) => b.flag && !flags[b.flag] && (!b.when || passes(b.when, ctx)));
        // 들를 마을: 아직 일어날 일이 남은 visit 페이즈 (하루에 한 번)
        const open = (p) => (p.events ?? []).some((e) => !flags[`done.${e.id}`] && (!e.when || passes(e.when, ctx)));
        const visit = !ph.visit && Object.entries(ch.phases).find(([id, p]) => p.visit && visitedOn[id] !== clock.day && (!p.when || passes(p.when, ctx)) && (open(p) || !entered.has(id)))?.[0];
        if (boss) { flags[boss.flag] = true; log.push(`보스 ${boss.enemies.join(',')}`); }
        else if (visit) { visitedOn[visit] = clock.day; next = { phase: visit, back: phaseId }; log.push(`→ ${visit}`); }
        else if (ph.visit) { next = { phase: returnTo }; log.push(`← ${returnTo}`); }
        // 할 일이 없으면 시간을 흘려보낸다(두 시간씩, 밤 11시까지). 그래도 없으면 자고 다음 날 아침
        else if (!ph.visit && clock.minute < 23 * 60) clock.minute += 120;
        else { clock.day += 1; clock.minute = 9 * 60; log.push(`${clock.day}일째`); }
      }
      time += 0.5;
    }
    if (!next) return { stuck: phaseId, log, flags };
    if (next.end) ended = next.end;
    else { if (next.back) returnTo = next.back; phaseId = next.phase; }
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

  // 2·3장: 앞 장들을 마친 상태에서 시작한다
  const PART1 = { 'selena.done': true, 'done.lu': true, 'done.keeper': true, 'ch1.departed': true, 'leon.arrived': true };
  it.each([[[]], [['hort', 'elder']]])('2장 「안개 너머」를 끝까지 간다 — 지워짐: %j', (erased) => {
    const r = playChapter('chapter2', erased, { flags: PART1, maxSeconds: 6000 });
    expect(r.stuck, r.log.join('\n')).toBeUndefined();
    expect(r.ended).toEqual({ chapter: 'chapter3', phase: 'winter' });
    for (const f of ['ch2.knight_beaten', 'ch2.sei_eda', 'rank.squire']) expect(r.flags[f], f).toBe(true);
  });
  it.each([[[]], [['hort', 'tom', 'rine', 'per']]])('3장 「겨울 준비」를 끝까지 간다 — 지워짐: %j', (erased) => {
    const r = playChapter('chapter3', erased, { flags: { ...PART1, 'rank.squire': true, 'ch2.done': true }, maxSeconds: 8000 });
    expect(r.stuck, r.log.join('\n')).toBeUndefined();
    expect(r.flags['part1.done']).toBe(true);
    for (const f of ['route.mia.hands', 'route.selena.made_up', 'route.lu.back']) expect(r.flags[f], f).toBe(true);
  });

  it('1장 도입도 끝까지 간다 (1명 이상 지워진 상태)', () => {
    // 1장은 프롤로그를 마친 뒤에만 온다(셀레나·루를 만났고, 종탑의 밤을 지났다)
    const r = playChapter('chapter1', ['hort'], { flags: { 'selena.done': true, 'done.lu': true, 'done.keeper': true }, maxSeconds: 3000 });
    expect(r.stuck, r.log.join('\n')).toBeUndefined();
    expect(r.ended).toBeDefined();
  });
});
