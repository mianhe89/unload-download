// 대사 소리: 글자가 찍힐 때 짧은 '도' 소리를 합성한다 (파일 없음 — Web Audio로 즉석에서).
// 높이는 사람마다 다르고, 한글은 첫소리(초성)에 따라 살짝 오르내려서 말하는 느낌이 난다.
import { VOICES, DEFAULT_VOICE } from '../../../content/characters/voices.js';
import { Sound } from './Sound.js';

export const voiceOf = (id) => ({ ...DEFAULT_VOICE, ...(VOICES[id] ?? {}) });

// 순수: 글자 하나의 소리 (테스트 가능)
export function blipFor(voice, ch, i = 0) {
  const code = ch.codePointAt(0);
  let step;
  if (code >= 0xac00 && code <= 0xd7a3) step = Math.floor((code - 0xac00) / 588) % 7; // 초성 19개 → 7단
  else step = code % 7;
  const freq = voice.pitch * (1 + (step - 3) / 3 * voice.spread);
  return { freq: Math.round(freq), wave: voice.wave, dur: 0.045, play: i % (voice.every ?? 1) === 0 };
}

let last = 0;
export function blip(scene, voice, ch, i, volume = 0.05) {
  const b = blipFor(voice, ch, i);
  if (!b.play || Sound.muted) return;
  const ctx = scene.sound?.context;
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (now - last < 0.03) return; // 너무 촘촘하면 하나만
  last = now;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = b.wave;
    osc.frequency.setValueAtTime(b.freq, now);
    osc.frequency.exponentialRampToValueAtTime(b.freq * 0.92, now + b.dur);
    const v = b.wave === 'square' || b.wave === 'sawtooth' ? volume * 0.6 : volume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(v, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + b.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + b.dur + 0.01);
  } catch { /* 소리가 안 나도 대사는 계속 */ }
}
