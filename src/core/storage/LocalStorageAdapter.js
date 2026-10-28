// 브라우저 localStorage 어댑터 (웹판 기본)
export class LocalStorageAdapter {
  constructor(prefix = 'ud.') {
    this.name = 'localStorage';
    this.prefix = prefix;
  }

  async read(key) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null; // 사생활 보호 모드 등 저장 불가 환경
    }
  }

  async write(key, value) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch { /* 무시 */ }
  }

  async remove(key) {
    try { localStorage.removeItem(this.prefix + key); } catch { /* 무시 */ }
  }
}
