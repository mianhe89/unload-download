// 대사 꾸밈 문법 (순수 함수 — 테스트 가능)
//   [y]중요[/y]        노란 형광펜 강조
//   [r]위험[/r]        빨강   [b]..[/b] 파랑   [g]..[/g] 흐린 회색(속삭임)
//   [shake]..[/shake]  떨림   [wave]..[/wave] 물결   [big]..[/big] 큰 글자
//   [i=wood]           아이템 이름을 등급 색으로 (이름은 자동)
//   [q=epic]..[/q]     등급 색으로 칠하기 (common~legendary)
//   [w=300]            그 자리에서 300ms 멈춤
//   [mood=smile]       (맨 앞) 이 대사의 표정 — 일러스트가 바뀌고, 일러스트가 없으면 감정 말풍선이 뜬다
//   [emote=love]       머리 위 감정 말풍선만 (content/art/emotes.js)
// 문장부호 뒤에는 저절로 잠깐 멈춘다. 모르는 태그는 글자 그대로 둔다.
import { ITEMS, RARITY } from '../../content/items/items.js';

const COLOR_TAGS = { y: 'mark', r: 'red', b: 'blue', g: 'dim' };
const FX_TAGS = ['shake', 'wave', 'big'];
const TAG = /\[(\/?)([a-z]+)(?:=([\w.-]+))?\]/g;

export const PAUSE = { '.': 200, '!': 200, '?': 200, '…': 260, ',': 90, '~': 120 };

// text → { glyphs: [{ ch, color, fx, big, item, wait }], mood, emote }
export function parseRich(text) {
  const glyphs = [];
  const stack = { color: [], fx: [] };
  let mood = null;
  let emote = null;
  let last = 0;
  let pendingWait = 0;
  const push = (s) => {
    for (const ch of s) {
      const fx = stack.fx.filter((f) => f !== 'big');
      glyphs.push({
        ch,
        color: stack.color.at(-1) ?? null,
        fx: fx.at(-1) ?? null,
        big: stack.fx.includes('big'),
        wait: pendingWait,
      });
      pendingWait = 0;
    }
  };
  for (const m of text.matchAll(TAG)) {
    const [raw, close, name, arg] = m;
    const known = name in COLOR_TAGS || FX_TAGS.includes(name) || ['i', 'w', 'mood', 'q', 'emote'].includes(name);
    if (!known) continue;
    push(text.slice(last, m.index));
    last = m.index + raw.length;
    if (name === 'mood' && !close) mood = arg;
    else if (name === 'emote' && !close) emote = arg;
    else if (name === 'w' && !close) pendingWait += Number(arg) || 0;
    else if (name === 'i' && !close) {
      const it = ITEMS[arg];
      const before = glyphs.length;
      push(it?.name ?? arg);
      for (let k = before; k < glyphs.length; k += 1) { glyphs[k].color = `rarity.${it?.rarity ?? 'common'}`; glyphs[k].item = arg; }
    } else if (name === 'q') {
      if (close) stack.color.pop(); else stack.color.push(`rarity.${arg}`);
    } else if (name in COLOR_TAGS) {
      if (close) stack.color.pop(); else stack.color.push(COLOR_TAGS[name]);
    } else if (close) {
      const i = stack.fx.lastIndexOf(name);
      if (i >= 0) stack.fx.splice(i, 1);
    } else stack.fx.push(name);
  }
  push(text.slice(last));
  if (pendingWait && glyphs.length) glyphs.at(-1).after = pendingWait;
  return { glyphs, mood, emote };
}

// 태그를 뺀 글자만 (읽는 시간 계산, 테스트용)
export const plain = (text) => parseRich(text).glyphs.map((g) => g.ch).join('');

// 글자 하나를 찍은 뒤 기다릴 시간(ms)
export function delayAfter(glyphs, i, base = 28) {
  const g = glyphs[i];
  const next = glyphs[i + 1];
  let d = base;
  // 문장부호는 다음 글자가 이어지는 부호가 아닐 때만 쉰다 ("..." 는 한 번에)
  if (PAUSE[g.ch] && !(next && PAUSE[next.ch])) d += PAUSE[g.ch];
  if (g.ch === ' ') d = Math.round(base * 0.5);
  return d + (next?.wait ?? 0) + (g.after ?? 0);
}

// 소리 낼 글자인가 (공백·문장부호는 조용히)
export const voiced = (ch) => /[\p{L}\p{N}]/u.test(ch);

// 배치: 공백 단위로 줄을 바꾼다. 한 단어가 한 줄보다 길면 글자 단위로 자른다.
// measure(glyph) → 너비(px). 결과: 각 글자에 x, line 을 붙인 배열과 줄 수
export function layout(glyphs, measure, maxWidth) {
  const out = glyphs.map((g) => ({ ...g, x: 0, line: 0, w: measure(g) }));
  let line = 0, x = 0, i = 0;
  while (i < out.length) {
    if (out[i].ch === '\n') { out[i].line = line; out[i].x = x; line += 1; x = 0; i += 1; continue; }
    // 단어: 공백·줄바꿈 전까지
    let j = i;
    while (j < out.length && out[j].ch !== ' ' && out[j].ch !== '\n') j += 1;
    const wordW = out.slice(i, j).reduce((s, g) => s + g.w, 0);
    if (x > 0 && x + wordW > maxWidth) { line += 1; x = 0; }
    for (let k = i; k < j; k += 1) {
      if (x > 0 && x + out[k].w > maxWidth) { line += 1; x = 0; }
      out[k].x = x; out[k].line = line; x += out[k].w;
    }
    if (j < out.length && out[j].ch === ' ') {
      // 줄 끝 공백은 다음 줄로 넘기지 않는다
      out[j].x = x; out[j].line = line; x += out[j].w; j += 1;
    }
    i = j;
  }
  return { glyphs: out, lines: out.length ? Math.max(...out.map((g) => g.line)) + 1 : 0 };
}

// 색 이름 → CSS 색 (흰 바탕 기준). rarity.* 는 아이템 등급 색
// dark: 어두운 바탕용 (밝은 색)
export function colorOf(name, base, dark = false) {
  if (!name) return base;
  if (name.startsWith('rarity.')) return RARITY[name.slice(7)]?.[dark ? 'glow' : 'ink'] ?? base;
  if (dark) return { mark: '#ffd75e', red: '#ff7a7a', blue: '#8ab4ff', dim: '#9a94a8' }[name] ?? base;
  return { mark: '#a35f00', red: '#c8323c', blue: '#2f5fc4', dim: '#8a8494' }[name] ?? base;
}
