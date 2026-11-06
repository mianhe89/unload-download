// 플레이테스트 기록: 테스터가 어디서 얼마나 머물렀고, 무엇을 보고, 언제 껐는지를 남긴다.
// 주소에 ?playtest(=1)를 붙여 한 번 열면 이 브라우저에 켜진 채 기억된다(?playtest=0으로 끈다). 꺼져 있으면 아무것도 쓰지 않는다.
// 세이브와 따로 둔다(ud.playlog) — 세이브 구조를 건드리지 않고, RESET & START로도 지워지지 않는다.
// 내보내기: ESC 메뉴의 '플레이 기록 저장'(켜져 있을 때만 보인다) 또는 콘솔 __ud.playlog(). 읽기: node tools/playlog-report.mjs 파일.json
const KEY = 'ud.playlog';
const ON = 'ud.playtest';
const CAP = 20000; // 기록 줄 수 상한 (넘으면 오래된 것부터 버린다)

function store() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

export const PlayLog = {
  enabled: false,
  session: null,
  rows: [],

  // 시작할 때 한 번: 주소를 보고 켜고 끈다
  init({ search = typeof location !== 'undefined' ? location.search : '', storage = store(), now = Date.now() } = {}) {
    this.storage = storage;
    const q = new URLSearchParams(search);
    if (q.has('playtest')) {
      const on = q.get('playtest') !== '0';
      try { if (on) storage?.setItem(ON, '1'); else storage?.removeItem(ON); } catch { /* 저장소가 막혔으면 이번 창에서만 */ }
      this.enabled = on;
    } else {
      try { this.enabled = storage?.getItem(ON) === '1'; } catch { this.enabled = false; }
    }
    if (!this.enabled) return this;
    try { this.rows = JSON.parse(storage?.getItem(KEY) ?? '[]'); } catch { this.rows = []; }
    this.session = now.toString(36);
    this.log('open', {}, now);
    return this;
  },

  log(k, data = {}, now = Date.now()) {
    if (!this.enabled) return;
    this.rows.push({ t: now, s: this.session, k, ...data });
    if (this.rows.length > CAP) this.rows.splice(0, this.rows.length - CAP);
    this.flush();
  },

  flush() {
    try { this.storage?.setItem(KEY, JSON.stringify(this.rows)); } catch { /* 가득 찼으면 다음에 */ }
  },

  clear() { this.rows = []; this.flush(); },

  // 파일로 내려받기 (브라우저)
  download() {
    if (typeof document === 'undefined') return;
    const blob = new Blob([JSON.stringify({ version: 1, rows: this.rows }, null, 0)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `playlog-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};
