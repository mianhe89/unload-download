// 대사 꾸밈·글자 찍기·목소리·일러스트 고르기·아이템 등급 색
import { describe, it, expect } from 'vitest';
import { parseRich, plain, delayAfter, layout, voiced, colorOf } from '../../src/ui/rich.js';
import { blipFor, voiceOf } from '../../src/core/audio/Voice.js';
import { portraitKey, stageOf } from '../../src/ui/portraits.js';
import { HEROINES, STAGES, MOODS } from '../../content/portraits/portraits.js';
import { VOICES } from '../../content/characters/voices.js';
import { ITEMS, RARITY, GRADE_RARITY } from '../../content/items/items.js';
import { HIDDEN_SKILLS, ITEM_NAMES } from '../../content/farm/farm.js';
import { characters } from '../../content/characters/index.js';
import { lineSeconds } from '../../src/core/script/speech.js';

describe('대사 꾸밈', () => {
  it('[y]는 강조, 태그는 글자에서 빠진다', () => {
    const { glyphs } = parseRich('오늘은 [y]축제[/y]야.');
    expect(glyphs.map((g) => g.ch).join('')).toBe('오늘은 축제야.');
    expect(glyphs.filter((g) => g.color === 'mark').map((g) => g.ch).join('')).toBe('축제');
  });
  it('겹친 꾸밈: 떨림 안의 빨강, 큰 글자', () => {
    const { glyphs } = parseRich('[shake]무[r]서[/r]워[/shake] [big]쾅[/big]');
    expect(glyphs[1]).toMatchObject({ ch: '서', color: 'red', fx: 'shake' });
    expect(glyphs[2]).toMatchObject({ ch: '워', color: null, fx: 'shake' });
    expect(glyphs.at(-1)).toMatchObject({ ch: '쾅', big: true, fx: null });
  });
  it('[i=id]는 아이템 이름을 등급 색으로', () => {
    const { glyphs } = parseRich('[i=starDust] 하나');
    expect(plain('[i=starDust] 하나')).toBe('별가루 하나');
    expect(glyphs[0].color).toBe('rarity.legendary');
    expect(colorOf(glyphs[0].color, '#000')).toBe(RARITY.legendary.ink);
  });
  it('[mood]는 표정, [w]는 멈춤, 모르는 태그는 그대로', () => {
    const r = parseRich('[mood=shy]그게…[w=400]고마워. [x]');
    expect(r.mood).toBe('shy');
    expect(r.glyphs.find((g) => g.ch === '고').wait).toBe(400);
    expect(plain('[x]')).toBe('[x]');
  });
  it('문장부호 뒤에서 쉬고, "..."는 한 번만 길게', () => {
    const { glyphs } = parseRich('네. 아...');
    expect(delayAfter(glyphs, 1)).toBeGreaterThan(delayAfter(glyphs, 0) * 3);
    expect(delayAfter(glyphs, 4)).toBe(delayAfter(glyphs, 0));
    expect(delayAfter(glyphs, 6)).toBeGreaterThan(200);
  });
  it('공백·부호는 소리 없이', () => {
    expect(voiced('가')).toBe(true);
    expect(voiced(' ')).toBe(false);
    expect(voiced('…')).toBe(false);
  });
  it('줄바꿈은 단어 단위, 너무 긴 단어는 글자 단위', () => {
    const m = () => 10;
    const a = layout(parseRich('가나 다라마 바').glyphs, m, 45);
    expect(a.glyphs.find((g) => g.ch === '다').line).toBe(1);
    expect(a.glyphs.find((g) => g.ch === '다').x).toBe(0);
    const b = layout(parseRich('가나다라마바사').glyphs, m, 30);
    expect(b.lines).toBe(3);
    expect(layout(parseRich('가\n나').glyphs, m, 100).lines).toBe(2);
  });
  it('말풍선 시간은 태그를 세지 않는다', () => {
    expect(lineSeconds('[y]축제[/y]')).toBe(lineSeconds('축제'));
  });
});

describe('목소리', () => {
  it('목소리 목록은 실제 인물만 (없는 인물은 기본 목소리)', () => {
    for (const id of Object.keys(VOICES)) expect(characters[id], id).toBeTruthy();
    expect(voiceOf('누군지모름').pitch).toBeGreaterThan(0);
  });
  it('사람마다 높이가 다르고, 같은 글자는 늘 같은 소리', () => {
    expect(blipFor(voiceOf('kid'), '가').freq).toBeGreaterThan(blipFor(voiceOf('keeper'), '가').freq);
    expect(blipFor(voiceOf('mia'), '나')).toEqual(blipFor(voiceOf('mia'), '나'));
    const fs = new Set(['가', '나', '다', '라', '마', '바', '사'].map((c) => blipFor(voiceOf('mia'), c).freq));
    expect(fs.size).toBeGreaterThan(3);
  });
  it('빠르게 말하는 사람은 두 글자에 한 번', () => {
    expect(blipFor(voiceOf('merchant'), '가', 1).play).toBe(false);
    expect(blipFor(voiceOf('selena'), '가', 1).play).toBe(true);
  });
});

describe('일러스트 고르기', () => {
  const has = (set) => (k) => set.has(k);
  it('호감도가 오르면 단계가 바뀐다 (히로인만)', () => {
    expect(stageOf('mia', 0)).toBe('base');
    expect(stageOf('mia', 30)).toBe('close');
    expect(stageOf('mia', 999)).toBe('love');
    expect(stageOf('hort', 999)).toBe('base');
  });
  it('없는 그림은 아래 단계·기본 얼굴로, 하나도 없으면 null', () => {
    const files = new Set(['portrait.mia', 'portrait.mia.happy', 'portrait.mia@warm']);
    expect(portraitKey('mia', { mood: 'shy', affinity: 30 }, has(files))).toBe('portrait.mia@warm');
    expect(portraitKey('mia', { mood: 'smile', affinity: 0 }, has(files))).toBe('portrait.mia.happy');
    expect(portraitKey('mia', {}, has(files))).toBe('portrait.mia');
    expect(portraitKey('lu', {}, has(files))).toBe(null);
  });
  it('히로인은 실제 인물', () => {
    for (const id of HEROINES) expect(characters[id], id).toBeTruthy();
    expect(STAGES[0].id).toBe('base');
    expect(MOODS).toContain('neutral');
  });
});

describe('아이템 등급 색', () => {
  it('모든 아이템은 정의된 등급, 등급마다 색이 다르다', () => {
    for (const it of Object.values(ITEMS)) expect(RARITY[it.rarity]).toBeTruthy();
    expect(new Set(Object.values(RARITY).map((r) => r.ink)).size).toBe(Object.keys(RARITY).length);
    expect(new Set(Object.values(RARITY).map((r) => r.glow)).size).toBe(Object.keys(RARITY).length);
  });
  it('히든 스킬 등급도 같은 색 체계', () => {
    for (const s of Object.values(HIDDEN_SKILLS)) expect(GRADE_RARITY[s.grade]).toBeTruthy();
  });
  it('파밍 아이템 이름은 아이템 목록에서', () => expect(ITEM_NAMES.wood).toBe('목재'));
});

describe('말 걸기 대화', async () => {
  const { TALK } = await import('../../content/talk/talk.js');
  const { chapters } = await import('../../content/chapters/index.js');
  const phases = {};
  for (const ch of Object.values(chapters)) for (const [pid, ph] of Object.entries(ch.phases)) phases[pid] = new Set([...(phases[pid] ?? []), ...Object.keys(ph.npcs ?? {})]);
  it('대화가 있는 인물은 그 페이즈에 실제로 있다', () => {
    for (const [id, byPhase] of Object.entries(TALK)) for (const pid of Object.keys(byPhase)) {
      expect(phases[pid], pid).toBeTruthy();
      expect(phases[pid].has(id), `${pid}:${id}`).toBe(true);
    }
  });
  it('화자는 등장인물이거나 내레이션, 태그는 알려진 것만', () => {
    for (const byPhase of Object.values(TALK)) for (const convos of Object.values(byPhase)) for (const c of convos) for (const line of c) {
      const [who, text] = typeof line === 'string' ? [null, line] : line;
      if (who) expect(characters[who], who).toBeTruthy();
      expect(plain(text), text).not.toMatch(/\[\/?(y|r|b|g|shake|wave|big|mood|w|i|q)\b/);
    }
  });
});
