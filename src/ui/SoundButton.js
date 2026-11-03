// 소리 끄기/켜기 버튼. 게임 화면 오른쪽 위 구석에 늘 떠 있다(타이틀·필드·전투 어디서나, 휴대폰에서도 누를 수 있게).
// 캔버스 위에 얹은 HTML 버튼이라 장면이 바뀌어도 그대로 있다. M 키로 바꿔도 모양이 따라 바뀐다.
import { Sound } from '../core/audio/Sound.js';

const ICON = {
  // 스피커 + 소리 물결
  on: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  // 스피커 + ×
  off: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};

export function mountSoundButton(parent = document.body) {
  const btn = document.createElement('button');
  btn.type = 'button';
  Object.assign(btn.style, {
    position: 'fixed', zIndex: 10, width: '34px', height: '34px', padding: '6px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(61, 43, 34, 0.82)', color: '#f8dc90',
    border: '1.5px solid #e8b860', borderRadius: '8px', cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)', touchAction: 'manipulation',
  });

  const render = (muted) => {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${muted ? ICON.off : ICON.on}</svg>`;
    const label = muted ? '소리 켜기 (M)' : '소리 끄기 (M)';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.style.opacity = muted ? '0.75' : '1';
  };

  // 게임 화면(캔버스)의 오른쪽 위 구석, 날짜·조작 안내 글 한 줄 아래에 붙인다
  const place = () => {
    const canvas = parent.querySelector('canvas') ?? document.querySelector('#game canvas');
    const r = canvas?.getBoundingClientRect();
    if (!r || !r.width) { btn.style.top = '12px'; btn.style.right = '12px'; return; }
    btn.style.top = `${Math.round(r.top + r.height * 0.065)}px`;
    btn.style.right = `${Math.round(window.innerWidth - r.right + r.width * 0.012)}px`;
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    Sound.toggleMute();
    btn.blur(); // 눌린 채로 포커스가 남으면 Space(대화 넘기기)가 버튼을 다시 누른다
  });

  render(Sound.muted);
  Sound.onMuteChange(render);
  parent.appendChild(btn);
  place();
  window.addEventListener('resize', place);
  // 캔버스가 처음 크기를 잡을 때까지 몇 번 다시 맞춘다
  [100, 400, 1200].forEach((ms) => setTimeout(place, ms));
  return btn;
}
