// 행동 파밍: 반복하면 히든 스킬, 벤 나무는 사라지고, 숲을 너무 베면 엘프 마을이 보이지 않는다
import { describe, it, expect } from 'vitest';
import { freshFarm, doFarm, countAction, applySkills, actionFor, elfVillageGone, meetsElf } from '../../src/farm/farm.js';
import { HIDDEN_SKILLS, FARM_TARGETS, ELF_FOREST_LIMIT } from '../../content/farm/farm.js';
import { OBJECTS } from '../../content/art/pack.js';
import { buildArea } from '../../src/world/buildArea.js';
import { HUBS } from '../../content/world/world.js';
import { characters } from '../../content/characters/index.js';

const always = () => 0;
const never = () => 0.999;

describe('행동 파밍', () => {
  it('벨 수 있는 것·깰 수 있는 것은 실제 물체다', () => {
    for (const list of Object.values(FARM_TARGETS)) for (const t of list) expect(OBJECTS[t], t).toBeTruthy();
    expect(actionFor('tree_pine')).toBe('chop');
    expect(actionFor('rocks_grey')).toBe('mine');
    expect(actionFor('house_plain')).toBe(null);
  });

  it('베면 목재가 쌓이고, 원래 상태는 그대로', () => {
    const f = freshFarm();
    const { farm } = doFarm(f, 'chop', never);
    expect(farm.items.wood).toBe(1);
    expect(f).toEqual(freshFarm());
  });

  it('히든 스킬은 정해진 횟수 전에는 절대 안 열리고, 그 뒤엔 확률로', () => {
    let f = freshFarm();
    const min = HIDDEN_SKILLS.woodcutter.min;
    for (let i = 1; i < min; i += 1) { const r = doFarm(f, 'chop', always); f = r.farm; expect(r.unlocked).toBe(null); }
    expect(doFarm(f, 'chop', never).unlocked).toBe(null);
    const r = doFarm(f, 'chop', always);
    expect(r.unlocked).toBe('woodcutter');
    expect(doFarm(r.farm, 'chop', always).unlocked).toBe(null); // 한 번만
  });

  it('걷기·잠은 횟수로 센다', () => {
    expect(countAction(freshFarm(), 'walk', 3000, always).unlocked).toBe('roamer');
    expect(countAction(freshFarm(), 'walk', 100, always).unlocked).toBe(null);
  });

  it('히든 스킬은 전투 능력치를 올린다', () => {
    const base = { atk: 20, def: 10, spd: 100, heavy: 1 };
    const s = applySkills(base, ['woodcutter', 'stonehand', 'roamer']);
    expect(s.atk).toBe(22);
    expect(s.def).toBe(11);
    expect(s.spd).toBe(105);
    expect(s.heavy).toBeCloseTo(1.1);
  });

  it('희귀도는 N·R·SR·SSR 중 하나', () => {
    for (const s of Object.values(HIDDEN_SKILLS)) expect(['N', 'R', 'SR', 'SSR']).toContain(s.grade);
  });
});

describe('세계가 반응한다', () => {
  it('벤 나무는 그 칸을 다시 지어도 없다', () => {
    const a = buildArea('surface', [2, 10]);
    const tree = a.objects.find((o) => actionFor(o.type) === 'chop');
    expect(tree).toBeTruthy();
    const b = buildArea('surface', [2, 10], { felled: [tree.at.join(',')] });
    expect(b.objects.some((o) => o.at.join(',') === tree.at.join(','))).toBe(false);
    expect(b.objects.length).toBe(a.objects.length - 1);
  });

  it('깊은 숲에서 베는 것만 숲 베기로 센다', () => {
    let f = freshFarm();
    f = doFarm(f, 'chop', never, { key: 'surface:7,9', at: '1,1', forest: false }).farm;
    expect(f.forestChops).toBe(0);
    f = doFarm(f, 'chop', never, { key: 'surface:2,10', at: '1,1', forest: true }).farm;
    expect(f.forestChops).toBe(1);
    expect(f.felled['surface:2,10']).toEqual(['1,1']);
  });

  it('숲을 지킨 사람만 엘프를 만나고, 너무 베면 엘프 마을이 보이지 않는다', () => {
    expect(meetsElf(freshFarm())).toBe(true);
    const some = { ...freshFarm(), forestChops: 1 };
    expect(meetsElf(some)).toBe(false);
    expect(elfVillageGone(some)).toBe(false);
    const many = { ...freshFarm(), forestChops: ELF_FOREST_LIMIT };
    expect(elfVillageGone(many)).toBe(true);
    const gone = buildArea('surface', HUBS.elf.at, { elfGone: true });
    expect(gone.objects.some((o) => o.type.startsWith('house'))).toBe(false);
    expect(gone.name).not.toBe('엘프 마을');
    expect(buildArea('surface', HUBS.elf.at).objects.some((o) => o.type.startsWith('house'))).toBe(true);
    expect(characters.elf).toBeTruthy();
  });
});
