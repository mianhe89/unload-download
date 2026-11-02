import { describe, it, expect, vi } from 'vitest';
import { Repository } from '../../src/core/save/SaveRepository.js';
import { MemoryAdapter } from '../../src/core/storage/MemoryAdapter.js';
import { assertAdapter } from '../../src/core/storage/StorageAdapter.js';
import { VERSION } from '../../src/core/save/SaveSchema.js';

describe('저장소 어댑터 계약', () => {
  it('read/write/remove가 없으면 거부한다', () => {
    expect(() => assertAdapter({ name: 'bad', read() {} })).toThrow(/write/);
  });

  it('메모리 어댑터는 복사본을 저장한다 (바깥에서 바꿔도 저장값이 안 바뀜)', async () => {
    const m = new MemoryAdapter();
    const v = { a: 1 };
    await m.write('k', v);
    v.a = 2;
    expect(await m.read('k')).toEqual({ a: 1 });
    await m.remove('k');
    expect(await m.read('k')).toBeNull();
  });
});

describe('세이브 저장소', () => {
  it('처음 열면 새 세이브를 만들고 저장한다', async () => {
    const st = new MemoryAdapter();
    const repo = new Repository(st);
    await repo.init();
    expect((await st.read('save')).version).toBe(VERSION);
  });

  it('update는 메모리를 바꾸고 저장소에 순서대로 쓴다', async () => {
    const st = new MemoryAdapter();
    const repo = new Repository(st);
    await repo.init();
    repo.update((d) => { d.world.loads = 1; });
    repo.update((d) => { d.world.loads = 2; });
    await repo.pending;
    expect(repo.get().world.loads).toBe(2);
    expect((await st.read('save')).world.loads).toBe(2);
  });

  it('예전 키(world)에 있던 v1 세이브를 읽어 이관한다', async () => {
    const st = new MemoryAdapter();
    await st.write('world', { loads: 2, erased: [{ id: 'tom', atLoad: 1 }], run: null });
    const repo = new Repository(st);
    await repo.init();
    expect(repo.get().version).toBe(VERSION);
    expect(repo.get().world.erased[0].id).toBe('tom');
  });

  it('쓰기가 한 번 실패해도 다음 쓰기는 계속된다', async () => {
    const st = new MemoryAdapter();
    const repo = new Repository(st);
    await repo.init();
    const real = st.write.bind(st);
    st.write = vi.fn().mockRejectedValueOnce(new Error('디스크 가득')).mockImplementation(real);
    repo.update((d) => { d.world.loads = 5; });
    repo.update((d) => { d.world.loads = 6; });
    await repo.pending;
    expect(repo.lastError?.message).toBe('디스크 가득');
    expect((await st.read('save')).world.loads).toBe(6);
  });

  it('읽기가 실패하면 새 세이브로 열린다 (게임이 멈추지 않음)', async () => {
    const st = new MemoryAdapter();
    st.read = vi.fn().mockRejectedValue(new Error('권한 없음'));
    const repo = new Repository(st);
    await repo.init();
    expect(repo.get().run).toBeNull();
    expect(repo.lastError?.message).toBe('권한 없음');
  });

  it('wipe는 세계까지 초기화하고 예전 키도 지운다', async () => {
    const st = new MemoryAdapter();
    await st.write('world', { loads: 9, erased: [] });
    const repo = new Repository(st);
    await repo.init();
    repo.update((d) => { d.world.loads = 9; });
    await repo.wipe();
    expect(repo.get().world.loads).toBe(0);
    expect(await st.read('world')).toBeNull();
  });
});
