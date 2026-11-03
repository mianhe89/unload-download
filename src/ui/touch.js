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

// 휴대폰·태블릿(손가락이 주된 입력)이거나 주소에 ?touch=1 이면 터치 조작을 보인다.
// 마우스·트랙패드가 있는 컴퓨터에서는 터치를 지원해도 띄우지 않는다(이 게임은 PC가 기본이다). ?touch=0 이면 늘 끈다
export const wantsTouch = (game) => {
  try {
    const q = new URLSearchParams(location.search).get('touch');
    if (q === '1') return true;
    if (q === '0') return false;
  } catch { /* 무시 */ }
  const mq = (m) => typeof matchMedia === 'function' && matchMedia(m).matches;
  if (mq('(any-pointer: fine)')) return false; // 마우스·트랙패드가 있다
  return Boolean(game.device.input.touch) && mq('(pointer: coarse)');
};
