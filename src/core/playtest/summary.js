// 플레이테스트 기록 요약 (순수 함수): PlayLog의 줄들 → 세션·페이즈별 시간·반응 없는 구간·말 건 사람·싸움·지워짐.
// tools/playlog-report.mjs가 이걸 읽기 좋게 찍는다.

// '무언가 일어났다'로 치는 기록 (이 사이가 길면 지루했을 수 있다)
const BEATS = new Set(['scene', 'talk', 'look', 'battle', 'ask', 'shop', 'life', 'pick']);
// 이보다 오래 아무 일 없으면 '반응 없는 구간'
export const QUIET_SECS = 60;
// 발자취(10초마다)에서 이만큼 연달아 안 걸었으면 '멈춰 있음'
const STILL_TICKS = 3;

export function summarize(rows) {
  const bySession = new Map();
  for (const r of rows) {
    if (!bySession.has(r.s)) bySession.set(r.s, []);
    bySession.get(r.s).push(r);
  }
  const sessions = [];
  const phaseTime = {};
  const talks = {};
  const quiet = [];
  const still = [];
  const battles = [];
  const erased = [];
  const asks = [];
  const scenes = [];

  for (const [id, rs] of bySession) {
    rs.sort((a, b) => a.t - b.t);
    const t0 = rs[0].t, tEnd = rs.at(-1).t;
    const min = (t) => Math.round(((t - t0) / 60000) * 10) / 10;
    let cur = null, curAt = t0, lastBeat = null, stillRun = [];
    const phases = [];
    const close = (t) => { if (cur) phaseTime[cur] = (phaseTime[cur] ?? 0) + (t - curAt) / 1000; };
    for (const r of rs) {
      if (r.k === 'phase' || r.k === 'area' || r.k === 'title') {
        close(r.t);
        cur = r.k === 'phase' ? `${r.ch}.${r.ph}${r.room ? `(${r.room})` : ''}` : r.k === 'area' ? `길 ${r.at}` : '타이틀';
        curAt = r.t;
        if (r.k !== 'title') phases.push(cur);
        lastBeat = r.t; // 새 장면에 들어선 것도 하나의 일
      }
      if (BEATS.has(r.k)) {
        if (lastBeat !== null && cur !== '타이틀' && (r.t - lastBeat) / 1000 >= QUIET_SECS) quiet.push({ session: id, where: cur, at: min(lastBeat), secs: Math.round((r.t - lastBeat) / 1000), next: r.label ?? r.npc ?? r.k });
        lastBeat = r.t;
      }
      if (r.k === 'scene.end') lastBeat = r.t; // 긴 장면을 본 시간은 '반응 없음'에 넣지 않는다
      if (r.k === 'scene') scenes.push({ session: id, at: min(r.t), label: r.label });
      if (r.k === 'talk') talks[r.npc] = (talks[r.npc] ?? 0) + 1;
      if (r.k === 'battle') battles.push({ session: id, at: min(r.t), foes: r.foes, boss: r.boss, start: r.t, retries: 0 });
      if (r.k === 'battle.retry' && battles.length) battles.at(-1).retries += 1;
      if (r.k === 'battle.end' && battles.length) Object.assign(battles.at(-1), { result: r.result, secs: Math.round((r.t - battles.at(-1).start) / 1000) });
      if (r.k === 'load' && r.victim) erased.push({ session: id, at: min(r.t), victim: r.victim, loads: r.loads });
      if (r.k === 'ask') asks.push({ id: r.id, pick: r.pick });
      if (r.k === 'trace') {
        if (!r.walk && !r.busy) stillRun.push(r);
        else {
          if (stillRun.length >= STILL_TICKS) still.push({ session: id, where: r.ph, at: min(stillRun[0].t), secs: stillRun.length * 10, tile: [stillRun[0].x, stillRun[0].y] });
          stillRun = [];
        }
      }
    }
    close(tEnd);
    const loads = rs.filter((r) => r.k === 'load');
    sessions.push({
      id, start: t0, minutes: min(tEnd),
      phases, loads: loads.length, victims: loads.filter((r) => r.victim).map((r) => r.victim),
      quitIn: rs.findLast((r) => r.k === 'phase' || r.k === 'area')?.ph ?? null,
      quit: rs.some((r) => r.k === 'quit'),
    });
  }
  for (const b of battles) delete b.start;
  return {
    sessions,
    phaseTime: Object.fromEntries(Object.entries(phaseTime).map(([k, v]) => [k, Math.round(v)])),
    talks, quiet: quiet.sort((a, b) => b.secs - a.secs), still: still.sort((a, b) => b.secs - a.secs),
    battles, erased, asks, scenes,
  };
}
