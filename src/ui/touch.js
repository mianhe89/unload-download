// 터치 입력 상태 (가상 조이스틱·버튼 → 키보드와 같은 자리로). 플레이어는 키보드와 이것을 함께 본다.
export const Touch = {
  x: 0, y: 0,           // 조이스틱 방향 (-1~1)
  actQueued: false,     // E 버튼이 눌렸다 (한 번 쓰면 사라진다)
  pressed(name) {
    const t = 0.35;
    return (name === 'left' && this.x < -t) || (name === 'right' && this.x > t) || (name === 'up' && this.y < -t) || (name === 'down' && this.y > t);
  },
  takeAct() { const a = this.actQueued; this.actQueued = false; return a; },
};

// 터치 기기이거나 주소에 ?touch=1 이면 터치 조작을 보인다
export const wantsTouch = (game) => {
  try { if (new URLSearchParams(location.search).get('touch') === '1') return true; } catch { /* 무시 */ }
  return Boolean(game.device.input.touch);
};
