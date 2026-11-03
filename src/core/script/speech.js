// 대사 처리 (순수 함수 — 테스트 가능).
// 1) 지워진 이름: 마을 사람 입에서 지워진 사람의 이름은 깨진 글자로 나온다.
//    내레이션과 주인공('me')만 이름을 온전히 말할 수 있다. 세상에서 그 이름을 기억하는 건 나 하나뿐이니까.
// 2) 걸으며 듣는 대사: 말풍선이 저절로 넘어가고, 화자에게서 멀면 들리지 않는다(놓친다).

const GLYPHS = ['▒', '■', '░', '▓'];

// 같은 이름은 늘 같은 모양으로 깨진다 (글자마다 정해진 깨진 글자, 길이는 그대로)
export function corrupt(name) {
  let out = '';
  for (let i = 0; i < name.length; i += 1) out += GLYPHS[(name.charCodeAt(i) + i * 7) % GLYPHS.length];
  return out;
}

// speaker: 화자 id (없으면 내레이션). goneNames: 지워진 사람들의 이름
export function maskNames(text, speaker, goneNames) {
  if (!speaker || speaker === 'me' || !goneNames.length) return text;
  let out = text;
  // 긴 이름부터 (한 이름이 다른 이름에 포함될 때 대비)
  for (const n of [...goneNames].sort((a, b) => b.length - a.length)) if (n) out = out.replaceAll(n, corrupt(n));
  return out;
}

// 이야기 속에서 지워진 사람: 세상(로드)에 지워진 사람 + 대본상 이미 사라진 사람(에다는 수확제 다음 날부터)
// gone: { notInPhases: [...] } — 그 페이즈들 밖에서는 사라진 사람
// 세이브에 이 판본에 없는 인물 id가 남아 있을 수 있다(예전 갈래의 세이브): 그런 id는 건너뛴다
export function goneIds(characters, { erased, phase }) {
  const ids = new Set(erased.filter((id) => characters[id]));
  for (const c of Object.values(characters)) if (c.gone && !c.gone.notInPhases.includes(phase)) ids.add(c.id);
  return [...ids];
}

// 말풍선이 떠 있는 시간(초): 읽을 만큼, 너무 짧거나 길지 않게
export function lineSeconds(text) {
  return Math.min(5.5, Math.max(1.8, 1.0 + text.length * 0.075));
}

// 화자와 이만큼(칸) 떨어지면 들리지 않는다
export const HEAR_TILES = 6;
export function canHear(dx, dy, tile = 16) {
  return Math.hypot(dx, dy) <= HEAR_TILES * tile;
}
