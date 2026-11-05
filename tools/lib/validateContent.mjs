// 콘텐츠 검증 로직. CLI(tools/validate-content.mjs)와 단위 테스트가 함께 쓴다.
// 대본·페이즈·캐릭터·맵이 서로 맞물리는지, 지워진 사람이 말하지 않는지, 소프트락이 없는지 본다.
import { chapters } from '../../content/chapters/index.js';
import { characters } from '../../content/characters/index.js';
import * as village from '../../content/maps/village.js';
import { MAPS, mapOf } from '../../content/maps/index.js';
import { existsSync } from 'node:fs';
import { PROP_NAMES } from '../../content/art/props.js';
import { OBJECTS, SHEETS, ANIMATED } from '../../content/art/pack.js';
import { ScriptRunner } from '../../src/core/script/ScriptRunner.js';
import { EventDirector } from '../../src/field/EventDirector.js';
import { CG, TINTS, PORTRAITS } from '../../content/cg.js';
import { doorStep } from '../../src/field/systems/Schedules.js';
import { RAIDS } from '../../content/raids.js';
import { FOES } from '../../content/action/foes.js';
import { QUESTS } from '../../content/quests/index.js';
import { HUBS } from '../../content/world/world.js';

export function validateContent() {
  const stats = {};
  const errs = [];
  const err = (m) => errs.push(m);
  // 이벤트 CG·인물 일러스트 파일 (content/cg.js)
  const assetMissing = (file) => !existsSync(new URL(`../../public/assets/${file}`, import.meta.url));
  for (const [id, cg] of Object.entries(CG)) {
    if (cg.file && assetMissing(cg.file)) err(`CG ${id}: 파일 없음 ${cg.file}`);
    if (!cg.file && !CG[cg.bg]?.file) err(`CG ${id}: 배경 없음 ${cg.bg}`);
    if (cg.figure && !PORTRAITS[cg.figure]) err(`CG ${id}: 인물 그림 없음 ${cg.figure}`);
  }
  for (const [id, p] of Object.entries(PORTRAITS)) {
    if (!characters[id]) err(`일러스트 ${id}: 인물 없음`);
    for (const file of [p.file, ...Object.values(p.faces ?? {})]) if (assetMissing(file)) err(`일러스트 ${id}: 파일 없음 ${file}`);
  }
  const solid = (x, y) => village.isSolidTile(x, y);
  // 지워짐 조합은 우리 마을 사람만 (다른 마을 사람은 그 마을 페이즈에만 나온다)
  const ERASABLE = Object.values(characters).filter((c) => c.erasable && (c.home ?? 'village') === 'village').map((c) => c.id);
  const KNOWN_ACTS = new Set(['spawnPickups', 'spawnNpc', 'walkTo', 'walkAway', 'despawn', 'weatherLeak', 'battle']);

  // 습격 (content/raids.js): 무리의 인물, 출발점·목표가 걸을 수 있는 칸인지, 시각 형식, 화자
  for (const r of RAIDS) {
    if (!/^\d\d:\d\d$/.test(r.at ?? '')) err(`습격 ${r.id}: 시각 형식 ${r.at}`);
    for (const [who] of [...(r.lines ?? []), ...(r.won?.lines ?? []), ...(r.lost?.lines ?? [])]) if (who && !characters[who]) err(`습격 ${r.id}: 화자 없음 ${who}`);
    if (r.kind !== 'raid') continue;
    const rm = MAPS[r.map ?? 'village'];
    if (!rm) { err(`습격 ${r.id}: 맵 없음 ${r.map}`); continue; }
    const solid = (x, y) => rm.isSolidTile(x, y);
    if (r.party) err(`습격 ${r.id}: 동료는 없다 — party를 지운다`);
    if (solid(...r.target)) err(`습격 ${r.id}: 목표가 막힌 칸 ${r.target}`);
    for (const b of r.band) {
      if (!characters[b.id]) err(`습격 ${r.id}: 인물 없음 ${b.id}`);
      if (solid(...b.from)) err(`습격 ${r.id}: 출발점이 막힌 칸 ${b.from}`);
    }
  }

  // 퀘스트 단계의 목적지(goal): 사람·거점·장소·구역 이름이 실제로 있는지 (작은 지도의 별·화살표)
  {
    const spotNames = new Set(Object.values(MAPS).flatMap((m) => Object.keys(m.spots ?? {})));
    const zoneNames = new Set(Object.values(MAPS).flatMap((m) => Object.keys(m.zones ?? {})));
    for (const q of Object.values(QUESTS)) q.steps.forEach((st, i) => {
      for (const g of [st.goal ?? []].flat()) {
        const at = `퀘스트 ${q.id} ${i}단계 목적지`;
        if (g.npc && !characters[g.npc]) err(`${at}: 인물 없음 ${g.npc}`);
        if (g.place && !HUBS[g.place]) err(`${at}: 거점 없음 ${g.place}`);
        if (g.spot && !spotNames.has(g.spot)) err(`${at}: 장소 없음 ${g.spot}`);
        if (g.zone && !zoneNames.has(g.zone)) err(`${at}: 구역 없음 ${g.zone}`);
      }
    });
  }

  // 하루 일과: 시각 형식, 장소가 있는지, 걸을 수 있는 칸인지, 집으로 가면 집(맵 objects의 residents)이 있는지
  for (const c of Object.values(characters)) {
    const hm = MAPS[c.home ?? 'village'];
    if (!hm) { err(`인물 ${c.id}: 사는 맵 없음 ${c.home}`); continue; }
    const solid = (x, y) => hm.isSolidTile(x, y);
    for (const e of c.schedule ?? []) {
      const at = `일과 ${c.id} ${e.from}`;
      if (!/^\d\d:\d\d$/.test(e.from ?? '')) err(`${at}: 시각 형식`);
      if (e.home) {
        const home = hm.objects.find((o) => o.residents?.includes(c.id));
        if (!home) err(`${at}: 집 없음`);
        else if (solid(...doorStep(home))) err(`${at}: 집 문 앞이 막힌 칸`);
        continue;
      }
      const p = Array.isArray(e.at) ? e.at : hm.spots[e.at] && [Math.round(hm.spots[e.at].x), Math.round(hm.spots[e.at].y)];
      if (!p) err(`${at}: 장소 없음 ${e.at}`);
      else if (solid(...p)) err(`${at}: 막힌 칸 ${p}`);
    }
  }

  // 캐릭터
  for (const c of Object.values(characters)) {
    if (!c.sprite?.base) err(`캐릭터 ${c.id}: sprite.base 없음`);
    else if (!existsSync(new URL(`../../assets-src/ninja-adventure/Actor/Characters/${c.sprite.base}/SpriteSheet.png`, import.meta.url))) err(`캐릭터 ${c.id}: 바탕 스프라이트 파일 없음 ${c.sprite.base}`);
    if (c.remnant && !PROP_NAMES.includes(c.remnant.prop) && !OBJECTS[c.remnant.prop]) err(`캐릭터 ${c.id}: 흔적 소품 없음 ${c.remnant.prop}`);
  }

  // 맵 (이야기 필드가 쓰는 맵마다): 크기, 물체, 장소·구역에 걸어서 닿는지
  // 걸어 닿는 칸은 그 맵을 쓰는 첫 페이즈의 시작점에서 센다
  const reachOf = {};
  for (const [mid, m] of Object.entries(MAPS)) {
    const at = `맵 ${mid}`;
    const msolid = (x, y) => m.isSolidTile(x, y);
    if (m.terrain.length !== m.H || m.terrain.some((r) => r.length !== m.W)) err(`${at}: 바닥 크기가 맞지 않음`);
    for (const [name, sp] of Object.entries(m.spots)) if (sp.x < 0 || sp.y < 0 || sp.x >= m.W || sp.y >= m.H) err(`${at}: 장소 범위 밖 ${name}`);
    for (const o of m.objects) {
      const def = OBJECTS[o.type];
      if (!def) { err(`${at}: 알 수 없는 물체 ${o.type}`); continue; }
      if (!def.sheet.startsWith('gen:') && !SHEETS[def.sheet]) err(`${at}: ${o.type}의 시트 없음 ${def.sheet}`);
    }
    for (const a of m.animated) if (!ANIMATED[a.type]) err(`${at}: 알 수 없는 움직이는 장식 ${a.type}`);
    const firstPhase = Object.values(chapters).flatMap((c) => Object.values(c.phases)).find((ph) => mapOf(ph) === m);
    const start = firstPhase?.player.at ?? m.entry(m.exits[0]?.dir);
    if (!start) { err(`${at}: 시작점이 없음`); continue; }
    const reach = new Set([start.join(',')]);
    const q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (!reach.has(k) && !msolid(x + dx, y + dy)) { reach.add(k); q.push([x + dx, y + dy]); }
      }
    }
    const ok = (x, y) => reach.has(`${Math.round(x)},${Math.round(y)}`);
    reachOf[mid] = ok;
    for (const [name, sp] of Object.entries(m.spots)) {
      const near = [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1], [0, 2]].some(([dx, dy]) => ok(Math.floor(sp.x) + dx, Math.floor(sp.y) + dy));
      if (!near) err(`${at}: 장소 ${name}에 걸어갈 수 없음`);
    }
    for (const [name, z] of Object.entries(m.zones)) {
      let reachIn = false;
      for (let y = z.y; y < z.y + z.h; y += 1) for (let x = z.x; x < z.x + z.w; x += 1) if (ok(x, y)) reachIn = true;
      if (!reachIn) err(`${at}: 구역 ${name}에 걸어서 닿을 수 없음`);
    }
    // 출구는 걸어서 닿아야 한다
    for (const e of m.exits) {
      const cells = [];
      for (let i = e.from; i < e.to2; i += 1) cells.push(e.dir === 'n' ? [i, m.FOG + 1] : e.dir === 's' ? [i, m.H - m.FOG - 2] : e.dir === 'w' ? [m.FOG + 1, i] : [m.W - m.FOG - 2, i]);
      if (!cells.some(([x, y]) => ok(x, y))) err(`${at}: 출구 ${e.dir}에 걸어서 닿을 수 없음`);
    }
  }
  const reachable = (x, y) => reachOf.village(x, y);
  // 대본 라벨이 어느 맵에서 돌아가는가: 그 라벨을 부르는 페이즈의 맵 (기본 우리 마을)
  const labelMap = {};
  for (const ch of Object.values(chapters)) for (const ph of Object.values(ch.phases)) {
    const m = mapOf(ph);
    for (const l of [ph.onEnter, ...(ph.events ?? []).map((e) => e.run)].filter(Boolean)) labelMap[l] = m;
  }

  for (const [cid, ch] of Object.entries(chapters)) {
    const S = ch.script;
    // 대본 노드
    for (const [label, nodes] of Object.entries(S)) nodes.forEach((n, i) => {
      const at = `${cid}:${label}[${i}]`;
      const lm = labelMap[label] ?? village;
      const solid = (x, y) => lm.isSolidTile(x, y);
      const reachable = (x, y) => reachOf[lm.id ?? 'village'](x, y);
      if (n.who && !characters[n.who]) err(`${at} 화자 없음 ${n.who}`);
      if (n.cg && !CG[n.cg]) err(`${at} CG 없음 ${n.cg}`);
      if (n.tint && !TINTS[n.tint]) err(`${at} 색조 없음 ${n.tint}`);
      if (n.face && !PORTRAITS[n.who]?.faces?.[n.face]) err(`${at} 표정 없음 ${n.who}.${n.face}`);
      if (n.bubble && !characters[n.bubble.who]) err(`${at} 말풍선 화자 없음`);
      if (n.goto && !S[n.goto]) err(`${at} goto 없음 ${n.goto}`);
      if (n.phase && !ch.phases[n.phase]) err(`${at} 페이즈 없음 ${n.phase}`);
      if (n.end && n.next && !chapters[n.next.chapter]?.phases[n.next.phase]) err(`${at} 다음 지점 없음`);
      if (n.act && !KNOWN_ACTS.has(n.act)) err(`${at} 알 수 없는 동작 ${n.act}`);
      if (n.act === 'walkTo') for (const [x, y] of n.path ?? [n.to]) if (solid(x, y)) err(`${at} 걸어갈 칸이 막혀 있음 ${x},${y}`);
      if (n.act === 'spawnPickups') {
        if (!PROP_NAMES.includes(n.prop)) err(`${at} 소품 없음 ${n.prop}`);
        for (const [x, y] of n.items) { if (solid(x, y)) err(`${at} 물건이 막힌 칸에 있음 ${x},${y}`); else if (!reachable(x, y)) err(`${at} 물건에 걸어갈 수 없음 ${x},${y}`); }
        if (n.expire?.run && !S[n.expire.run]) err(`${at} 만료 컷신 없음`);
      }
      if (n.act === 'spawnNpc' && !characters[n.id]) err(`${at} 인물 없음 ${n.id}`);
      if (n.ask && !(Array.isArray(n.options) && n.options.length >= 2 && n.options.length <= 4)) err(`${at} 질문의 선택지는 2~4개`);
      if (n.ask && nodes[0]?.mode === 'walk') err(`${at} 질문은 걷는 대사(WALK)에 둘 수 없다`);
      if (n.act === 'battle') for (const id of n.enemies ?? []) if (!FOES[id]) err(`${at} 전투 상대 없음 ${id}`);
    });
    // 페이즈
    for (const [pid, ph] of Object.entries(ch.phases)) {
      const at = `${cid}/${pid}`;
      const pm = mapOf(ph);
      if (!pm) { err(`${at} 맵 없음 ${ph.map}`); continue; }
      const solid = (x, y) => pm.isSolidTile(x, y);
      const reachable = reachOf[pm.id];
      if (ph.onEnter && !S[ph.onEnter]) err(`${at} onEnter 없음 ${ph.onEnter}`);
      if (solid(...ph.player.at)) err(`${at} 플레이어 시작점이 막힘`);
      for (const [id, n] of Object.entries(ph.npcs ?? {})) {
        if (!characters[id]) err(`${at} 인물 없음 ${id}`);
        if (solid(...n.at)) err(`${at} ${id} 위치가 막힘 ${n.at}`);
      else if (!reachable(...n.at)) err(`${at} ${id}에게 걸어갈 수 없음 ${n.at}`);
      }
      for (const p of ph.props ?? []) {
      if (!PROP_NAMES.includes(p.prop) && !OBJECTS[p.prop]) err(`${at} 소품 없음 ${p.prop}`);
      if (solid(...p.at)) err(`${at} 소품이 막힌 칸에 있음 ${p.at}`);
    }
      for (const e of ph.events ?? []) {
        if (!S[e.run]) err(`${at} 이벤트 ${e.id}: 컷신 없음 ${e.run}`);
        const t = e.trigger;
        if (t.zone && !pm.zones[t.zone]) err(`${at} 이벤트 ${e.id}: 구역 없음 ${t.zone}`);
        for (const who of [t.near, t.dwell].filter(Boolean)) {
          if (!characters[who] && !pm.spots[who]) err(`${at} 이벤트 ${e.id}: 대상 없음 ${who}`);
        }
      }
      // 진행 경로: 이 페이즈에서 다음 페이즈/끝으로 가는 컷신이 하나라도 있는가
      const exits = (ph.events ?? []).filter((e) => (S[e.run] ?? []).some((n) => n.phase || n.end));
      // visit: 들렀다 길로 나가는 페이즈, onRoad: 이야기가 길 위의 마을(visit 페이즈)에서 이어지는 고향 페이즈
      if (!exits.length && !ph.visit && !ph.onRoad) err(`${at} 다음으로 넘어가는 이벤트가 없음`);
    }
  }

  // 컷신마다 '그 사람이 있어야만 실행되는' 인물: 이벤트 when.unlessErased, talk.<페이즈>.<인물>
  const gatedBy = {};
  for (const ch of Object.values(chapters)) {
    for (const ph of Object.values(ch.phases)) for (const e of ph.events ?? []) {
      const ids = [e.when?.unlessErased].flat().filter(Boolean);
      (gatedBy[e.run] ??= new Set()); ids.forEach((i) => gatedBy[e.run].add(i));
    }
    for (const label of Object.keys(ch.script)) {
      const m = label.match(/^talk\.[^.]+\.(.+)$/);
      if (m) (gatedBy[label] ??= new Set()).add(m[1]);
    }
  }
  // 지워진 사람이 연 물건 컷신(시간 만료 등)도 그 사람 이벤트에서 나온 것으로 본다
  for (const ch of Object.values(chapters)) for (const [label, nodes] of Object.entries(ch.script)) {
    for (const n of nodes) if (n.expire?.run) (gatedBy[n.expire.run] ??= new Set(gatedBy[label] ?? []));
  }

  // 모든 지워짐 조합 × 모든 컷신을 끝까지 돌려본다
  stats.cutsceneRuns = 0;
  for (let mask = 0; mask < 1 << ERASABLE.length; mask += 1) {
    const erased = ERASABLE.filter((_, k) => mask & (1 << k));
    for (const ch of Object.values(chapters)) for (const label of Object.keys(ch.script)) {
      const flags = {};
      const r = new ScriptRunner(ch.script, {
        isErased: (id) => erased.includes(id), erasedCount: () => erased.length, loads: () => erased.length,
        flag: (n) => flags[n], setFlag: (n) => { flags[n] = true; }, addAffinity: () => {},
      });
      if ([...(gatedBy[label] ?? [])].some((id) => erased.includes(id))) continue;
      r.start(label);
      for (let n = r.next(); !n.done; n = r.next()) {
        if (n.who && erased.includes(n.who)) err(`지워진 ${n.who}가 말함: ${label} (지워짐: ${erased})`);
        if (n.phase || n.end) break;
      }
      stats.cutsceneRuns += 1;
    }
  }

  // 대본 실행기가 aff/flag를 빠짐없이 처리하는가 (aff와 flag가 한 노드에 같이 있는 경우 포함)
  for (const [cid, ch] of Object.entries(chapters)) for (const [label, nodes] of Object.entries(ch.script)) {
    const want = nodes.filter((n) => n.flag && !n.ifErased && !n.unlessErased && !n.ifFlag && !n.unlessFlag && n.minLoads == null && n.maxLoads == null && !n.ifErasedAny).map((n) => n.flag);
    if (!want.length) continue;
    const flags = {};
    const r = new ScriptRunner(ch.script, {
      isErased: () => false, erasedCount: () => 0, loads: () => 0,
      flag: (n) => flags[n], setFlag: (n) => { flags[n] = true; }, addAffinity: () => {},
    });
    r.start(label);
    for (let n = r.next(); !n.done && !n.phase && !n.end; n = r.next());
    for (const f of want) if (!flags[f]) err(`${cid}:${label} 플래그가 켜지지 않음: ${f}`);
  }

  // 축제 페이즈: 아무것도 안 하고 서 있어도 결국 다음 페이즈로 가는가 (소프트락 방지)
  {
    const ph = chapters.prologue.phases.festival;
    const d = new EventDirector(ph.events);
    const flags = {}, flagTime = {};
    let t = 0, fired = [];
    for (; t < 400 && !fired.includes('bells'); t += 0.1) {
      const { runs: rs } = d.update(0.1, {
        time: t, player: { x: 0, y: 0, idleTime: 0 }, pos: () => ({ x: 9999, y: 9999 }), inZone: () => false,
        pickedAll: () => false, flag: (n) => flags[n], flagTime: (n) => flagTime[n], passes: () => true,
      }, false);
      for (const x of rs) {
        fired.push(x.id);
        for (const n of chapters.prologue.script[x.run]) if (n.flag) { flags[n.flag] = true; flagTime[n.flag] = t; }
      }
    }
    if (!fired.includes('bells')) err('축제: 가만히 있으면 종이 울리지 않음 (소프트락)');
    else stats.idleBellsAt = Math.round(t);
  }

  return { errors: errs, stats };
}
