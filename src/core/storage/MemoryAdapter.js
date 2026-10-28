// 메모리 어댑터: 테스트, 저장이 막힌 환경의 대체용
export class MemoryAdapter {
  constructor() {
    this.name = 'memory';
    this.store = new Map();
  }

  async read(key) { return this.store.has(key) ? structuredClone(this.store.get(key)) : null; }
  async write(key, value) { this.store.set(key, structuredClone(value)); }
  async remove(key) { this.store.delete(key); }
}
