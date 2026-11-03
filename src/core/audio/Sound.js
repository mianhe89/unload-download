// 소리 창구. 효과음은 시작 때 미리 받고(작다), 음악은 처음 쓸 때 받아서 튼다(첫 화면을 가볍게).
// 음악은 장면이 바뀌면 천천히 줄이고 다음 곡으로 넘어간다. 같은 곡이면 이어서 튼다.
// M 또는 화면 오른쪽 위 소리 버튼(ui/SoundButton): 소리 끄기/켜기 (이 브라우저에만 기억)
import { SFX } from '../../../content/audio/audio.js';

const BASE = 'assets/audio/';
const STORE = 'ud.muted';
const MUSIC_VOL = 0.45;

const readMuted = () => { try { return localStorage.getItem(STORE) === '1'; } catch { return false; } };
const writeMuted = (v) => { try { localStorage.setItem(STORE, v ? '1' : '0'); } catch { /* 저장소가 막혀 있어도 게임은 계속 */ } };

const state = { manifest: null, game: null, music: null, musicKey: null, ambient: null, ambientKey: null, muted: readMuted() };
const listeners = new Set(); // 끄고 켤 때 알려 줄 곳 (소리 버튼)

const urls = (kind, key) => (state.manifest?.[kind]?.[key] ?? []).map((u) => BASE + u);

// 음량을 서서히: 소리 객체를 직접 트윈하지 않고 숫자 하나를 트윈해 옮겨 담는다.
// (소리가 먼저 지워져도 트윈이 지워진 객체를 건드려 장면 전체가 멈추는 일이 없게)
const alive = (snd) => Boolean(snd && snd.manager);
function tweenVolume(scene, snd, to, ms, onDone) {
  const box = { v: alive(snd) ? snd.volume : 0 };
  let t = null;
  const finish = () => { t?.remove(); onDone?.(); };
  try {
    t = scene.tweens.add({
      targets: box, v: to, duration: ms,
      onUpdate: () => { if (alive(snd)) snd.setVolume(box.v); else t?.remove(); },
      onComplete: finish,
    });
  } catch { if (alive(snd)) snd.setVolume(to); finish(); }
}

function fadeOut(scene, snd, ms = 600) {
  if (!snd) return;
  let done = false;
  const kill = () => { if (done) return; done = true; if (alive(snd)) { snd.stop(); snd.destroy(); } };
  tweenVolume(scene, snd, 0, ms, kill);
  setTimeout(kill, ms + 100); // 장면이 먼저 끝나 트윈이 사라져도 반드시 멈춘다
}

export const Sound = {
  get muted() { return state.muted; },

  // 게임 시작 때: 목록과 게임을 기억하고, 효과음을 미리 받는다 (Boot의 preload)
  preload(scene, manifest) {
    state.manifest = manifest;
    state.game = scene.game;
    scene.game.sound.mute = state.muted;
    if (!manifest) return;
    for (const key of Object.keys(SFX)) if (manifest.sfx[key]) scene.load.audio(`sfx.${key}`, urls('sfx', key));
  },

  toggleMute() {
    state.muted = !state.muted;
    writeMuted(state.muted);
    if (state.game) state.game.sound.mute = state.muted;
    listeners.forEach((fn) => fn(state.muted));
    return state.muted;
  },

  // 끄고 켤 때마다 fn(muted). 돌려받은 함수를 부르면 그만 듣는다
  onMuteChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  sfx(scene, key, opts = {}) {
    const def = SFX[key];
    if (!def || !scene.cache.audio.exists(`sfx.${key}`)) return;
    scene.sound.play(`sfx.${key}`, { volume: (opts.volume ?? def.vol ?? 0.4), detune: opts.detune ?? def.detune ?? 0, rate: opts.rate ?? 1 });
  },

  // 음악 바꾸기 (null이면 끈다)
  music(scene, key, { fade = 700 } = {}) {
    if (key === state.musicKey && state.music?.isPlaying) return;
    fadeOut(scene, state.music, fade);
    state.music = null;
    state.musicKey = key;
    if (!key || !state.manifest?.music[key]) return;
    const id = `mus.${key}`;
    const play = () => {
      if (state.musicKey !== key) return; // 받는 사이 다른 곡으로 넘어갔다
      const m = scene.sound.add(id, { loop: true, volume: 0 });
      m.play();
      tweenVolume(scene, m, MUSIC_VOL, fade);
      state.music = m;
    };
    if (scene.cache.audio.exists(id)) { play(); return; }
    scene.load.audio(id, urls('music', key));
    scene.load.once(`filecomplete-audio-${id}`, play);
    scene.load.start();
  },

  // 깔리는 소리 (바람·파도). null이면 끈다
  ambient(scene, key) {
    if (key === state.ambientKey) return;
    fadeOut(scene, state.ambient, 500);
    state.ambient = null;
    state.ambientKey = key;
    if (!key || !scene.cache.audio.exists(`sfx.${key}`)) return;
    state.ambient = scene.sound.add(`sfx.${key}`, { loop: true, volume: SFX[key].vol });
    state.ambient.play();
  },
};

if (typeof window !== 'undefined') window.__sound = Sound;
