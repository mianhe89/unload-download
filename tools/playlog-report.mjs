// 플레이테스트 기록 읽기: node tools/playlog-report.mjs playlog-*.json [더 많은 파일…]
// 테스터마다 파일 하나. 여러 개를 주면 하나씩 따로 찍는다.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { summarize, QUIET_SECS } from '../src/core/playtest/summary.js';

const files = process.argv.slice(2);
if (!files.length) {
  console.log('쓰는 법: node tools/playlog-report.mjs playlog-*.json');
  process.exit(1);
}

const when = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const mmss = (s) => `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;

for (const f of files) {
  const data = JSON.parse(readFileSync(f, 'utf8'));
  const s = summarize(data.rows ?? data);
  console.log(`\n━━━ ${basename(f)} ━━━`);

  console.log('\n[세션] 언제 켜서 얼마나 했고 어디서 껐나');
  for (const x of s.sessions) {
    console.log(`  ${when(x.start)}  ${x.minutes}분  로드 ${x.loads}번${x.victims.length ? `  지워짐: ${x.victims.join(', ')}` : ''}  마지막: ${x.quitIn ?? '-'}`);
  }

  console.log('\n[페이즈별 머문 시간]');
  for (const [k, v] of Object.entries(s.phaseTime).sort((a, b) => b[1] - a[1])) console.log(`  ${mmss(v).padStart(9)}  ${k}`);

  console.log(`\n[반응 없는 구간] ${QUIET_SECS}초 넘게 대사·말 걸기·살펴보기·싸움이 없었던 곳 (긴 순)`);
  if (!s.quiet.length) console.log('  없음');
  for (const q of s.quiet.slice(0, 8)) console.log(`  ${mmss(q.secs).padStart(9)}  ${q.where}  (${q.at}분부터, 그다음 ${q.next})`);

  console.log('\n[멈춰 서 있던 곳] 30초 넘게 안 걸은 곳 — 길을 잃었거나, 가만히 서 있기를 해 봤거나');
  if (!s.still.length) console.log('  없음');
  for (const q of s.still.slice(0, 8)) console.log(`  ${mmss(q.secs).padStart(9)}  ${q.where} [${q.tile}]  (${q.at}분)`);

  console.log('\n[말 건 사람] (많은 순)');
  console.log(`  ${Object.entries(s.talks).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ') || '없음'}`);

  console.log('\n[싸움]');
  if (!s.battles.length) console.log('  없음');
  for (const b of s.battles) console.log(`  ${b.at}분  ${b.boss ?? b.foes?.join(',') ?? '?'}  → ${b.result ?? '중단'}${b.secs ? ` (${b.secs}초)` : ''}${b.retries ? `  되돌리기 ${b.retries}번` : ''}`);

  console.log('\n[지워짐]');
  if (!s.erased.length) console.log('  없음');
  for (const e of s.erased) console.log(`  ${e.at}분  ${e.loads}번째 로드에 ${e.victim}`);

  if (s.asks.length) console.log(`\n[바깥을 향한 질문] ${s.asks.map((a) => `${a.id}→${a.pick}`).join(' · ')}`);

  console.log('\n[본 장면] 순서대로');
  let last = null;
  for (const c of s.scenes) {
    if (c.session !== last) { console.log(`  — 세션 ${c.session}`); last = c.session; }
    console.log(`  ${String(c.at).padStart(5)}분  ${c.label}`);
  }
}
