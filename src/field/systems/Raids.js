// 마을 습격(content/raids.js). 시계가 도는 날, 정해진 날·시각이 되면 경고 → 몬스터 무리가 북쪽 길에서 걸어와 목표로 향한다.
// 오크와 부딪히거나 곁에서 E를 누르면 사이드뷰 전투(Battle)로 넘어간다. 필드는 잠들어 있다가 전투가 끝나면 깨어난다.
// 이기면 그 오크는 왔던 길로 달아나고, 물러나면 그대로 간다. 다 물리치면 지킨 것, 하나라도 목표에 닿으면 못 지킨 것.
// 결과는 플래그·호감도로 남고, 못 지킨 습격이 쌓이면 마을이 함락된다. 전투에서 되돌리면(로드) 누군가 지워진다.
import { RAIDS, FALL_AFTER } from '../../../content/raids.js';
import { characters } from '../../../content/characters/index.js';
import { TILE } from '../../../content/maps/village.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { toMinute } from '../../../content/world/clock.js';
import { findPath, simplify } from './Path.js';
import { Npc } from '../Npc.js';

const REACH = 26;   // E로 맞설 수 있는 거리(px)
const BUMP = 12;    // 이만큼 붙으면 부딪힌 것
const HELPERS = ['selena', 'lu']; // 마을에 있으면 같이 싸운다(지워졌으면 없다)
const pick = (list) => (list?.length ? list[Math.floor(Math.random() * list.length)] : null);

export class Raids {
  constructor(field, map) {
    this.field = field;
    this.mapData = map;
    this.raid = null;    // 지금 진행 중인 습격 정의
    this.band = [];      // { npc, id, hp, state: 'wait'|'march'|'flee'|'gone'|'arrived', delay, from }
    this.busy = false;   // 경고·결과 장면을 보여 주는 중
    this.fighting = null; // 지금 전투 중인 오크
    if (typeof window !== 'undefined' && window.__ud) window.__ud.raid = (id) => this.begin(RAIDS.find((r) => r.id === id));
  }

  get active() { return Boolean(this.raid) && !this.busy; }

  update(dt) {
    if (this.busy) return;
    if (!this.raid) { this.check(); return; }
    const f = this.field;
    for (const m of this.band) {
      m.npc?.update(dt, { player: f.player, paused: false, blocked: () => false });
      m.npc?.sync();
      if (m.state === 'wait') {
        m.delay -= dt;
        if (m.delay <= 0) this.march(m);
      }
      if (m.cool > 0) m.cool -= dt;
    }
    // 길을 막고 서 있으면 부딪힌다
    const hit = this.band.find((b) => b.state === 'march' && b.npc && !(b.cool > 0) && f.player.distTo(b.npc.x, b.npc.y) < BUMP);
    if (hit) this.engage(hit);
  }

  // 오늘이 습격 날이고 그 시각이 지났는가. 시계가 도는 날에만 온다
  check() {
    const f = this.field;
    if (!f.clock.running || !f.home) return; // 습격은 우리 마을에만 온다
    for (const r of RAIDS) {
      if (WorldMemory.run.flags[`raid.${r.id}.over`]) continue;
      if (f.clock.day < r.day || (f.clock.day === r.day && f.clock.minute < toMinute(r.at))) continue;
      if (r.when && !f.world().passes(r.when)) continue;
      this.begin(r);
      return;
    }
  }

  async begin(r) {
    if (!r || this.raid) return;
    const f = this.field;
    this.raid = r;
    this.busy = true;
    WorldMemory.setFlag(`raid.${r.id}.on`);
    await this.scene(r.lines, r.kind === 'raid' ? 'bell' : null);
    if (r.kind === 'sign') { await this.finish(null); return; }
    f.ui.toast?.(`습격 · ${r.title} — ${r.targetName}을(를) 지켜라`);
    this.band = r.band.map((b) => ({ ...b, state: 'wait', delay: b.delay ?? 0, cool: 0, npc: null }));
    this.busy = false;
    f.refreshObjective?.();
  }

  // 무리 하나가 나타나 목표까지 길을 찾아 걷는다
  march(m) {
    const f = this.field;
    m.npc = new Npc(f, m.id, { at: m.from, mode: 'idle', face: 'down' });
    m.state = 'march';
    const path = simplify(findPath((x, y) => this.mapData.isSolidTile(x, y), m.from, this.raid.target, { cols: this.mapData.W, rows: this.mapData.H }));
    if (!path?.length) { this.arrive(m); return; }
    m.npc.route = path;
    m.npc.onArrive = () => this.arrive(m);
    this.say(m, pick(characters[m.id].barks));
  }

  // 습격 중에 E를 먼저 넘겨받는다. 곁의 몬스터에 맞섰으면 true
  onAct() {
    const f = this.field;
    const m = this.band
      .filter((b) => b.state === 'march' && b.npc)
      .map((b) => ({ b, d: f.player.distTo(b.npc.x, b.npc.y) }))
      .filter((x) => x.d < REACH)
      .sort((a, c) => a.d - c.d)[0]?.b;
    if (!m) return false;
    this.engage(m);
    return true;
  }

  // 같이 싸우는 사람: 나 + 마을에 있는 셀레나·루
  party() {
    return ['me', ...HELPERS.filter((id) => !WorldMemory.isErased(id))];
  }

  // 사이드뷰 전투로(systems/FieldBattle). 토르크는 곁의 오크 하나를 데리고 싸운다
  async engage(m) {
    if (this.fighting || this.busy || this.field.battle.busy) return;
    const f = this.field;
    this.fighting = m;
    this.say(m, pick(characters[m.id].barks));
    const tork = m.id === 'tork';
    const result = await f.battle.fight({
      party: this.party(),
      enemies: tork ? ['tork', 'orc'] : ['orc'],
      seed: this.raid.day * 100 + this.band.indexOf(m),
      tough: tork,
      note: tork ? '붉은 망토의 오크가 도끼를 고쳐 쥔다. 한쪽 엄니가 부러져 있다.' : '굶주린 오크가 몽둥이를 치켜든다.',
      winLine: tork ? '토르크가 무릎을 꿇었다가, 이를 갈며 일어나 물러난다.' : '오크가 비틀거리며 물러난다.',
    });
    this.fighting = null;
    if (!this.raid) return;
    if (result === 'win') { this.flee(m); return; }
    // 물러났다: 놈은 가던 길을 간다. 잠깐은 다시 부딪히지 않는다
    m.cool = 4;
    f.ui.toast?.('물러났다. 오크는 가던 길을 간다');
  }

  flee(m) {
    const f = this.field;
    m.state = 'flee';
    this.say(m, pick(characters[m.id].fleeBarks));
    const at = [Math.floor(m.npc.x / TILE), Math.floor(m.npc.y / TILE)];
    const path = simplify(findPath((x, y) => this.mapData.isSolidTile(x, y), at, m.from, { cols: this.mapData.W, rows: this.mapData.H }));
    const npc = m.npc;
    const vanish = () => {
      f.tweens.add({ targets: npc.sprite, alpha: 0, duration: 500, onComplete: () => npc.destroy() });
      m.state = 'gone';
    };
    if (path?.length) { npc.route = path; npc.onArrive = vanish; } else vanish();
    const left = this.band.filter((b) => b.state === 'wait' || b.state === 'march').length;
    f.ui.toast?.(`물리쳤다 (${this.band.length - left}/${this.band.length})`);
    if (!left) this.finish(true);
  }

  // 몬스터가 목표에 닿았다: 못 지켰다
  arrive(m) {
    if (m.state !== 'march' || !this.raid) return;
    m.state = 'arrived';
    this.finish(false);
  }

  say(m, str) { if (str && m.npc) this.field.ui.bubbles.show(m.npc, str, characters[m.id].color); }

  async finish(won) {
    const f = this.field;
    const r = this.raid;
    this.busy = true;
    // 남은 무리는 모두 물러간다
    for (const m of this.band) {
      if (!m.npc || m.state === 'gone') continue;
      const npc = m.npc;
      f.tweens.add({ targets: npc.sprite, alpha: 0, duration: 600, onComplete: () => npc.destroy() });
      m.npc = null;
      m.state = 'gone';
    }
    if (won !== null) {
      const out = won ? r.won : r.lost;
      for (const [id, n] of Object.entries(out.aff ?? {})) if (!WorldMemory.isErased(id)) WorldMemory.addAffinity(id, n);
      for (const fl of out.flags ?? []) WorldMemory.setFlag(fl);
      await this.scene(out.lines);
      if (!won) this.countLoss();
    } else {
      for (const fl of r.flags ?? []) WorldMemory.setFlag(fl);
    }
    WorldMemory.setFlag(`raid.${r.id}.over`);
    this.raid = null;
    this.band = [];
    this.busy = false;
    f.refreshObjective?.();
  }

  // 못 지킨 습격이 쌓이면 마을이 함락된다(이야기는 피난지에서 이어진다 — docs/스토리.md)
  countLoss() {
    const lost = RAIDS.filter((r) => WorldMemory.run.flags[`raid.${r.id}.lost`]).length;
    if (lost >= FALL_AFTER && !WorldMemory.run.flags['village.fallen']) {
      WorldMemory.setFlag('village.fallen');
      this.field.ui.toast?.('마을이 함락되었다');
    }
  }

  // 경고·결과 장면: 대화창에 차례로. 지워진 사람의 대사는 건너뛴다
  async scene(lines, fx) {
    const f = this.field;
    if (!lines?.length) return;
    f.setFrozen(true);
    if (fx) await f.fx(fx);
    for (const [who, say] of lines) {
      if (who && WorldMemory.isErased(who)) continue;
      const c = characters[who];
      await f.ui.say(c?.name ?? '', c?.color ?? '#cfc9dd', say, who || undefined);
    }
    f.ui.closeDialog();
    f.setFrozen(false);
  }
}
