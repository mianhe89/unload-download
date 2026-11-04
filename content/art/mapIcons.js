// 작은 지도의 건물 휘장 그림 (9×9). 흰 동그라미 안에 뜬다. 'o'는 어두운 외곽선, '.'은 빈칸.
// 어떤 건물에 무엇이 붙는지는 이름으로 정한다(iconFor). 주인이 지워진 집은 이름이 바뀌어 휘장이 붙지 않는다.
const O = '#2a2026';
export const MAP_ICONS = {
  bell: { pal: { o: O, y: '#e8b040', h: '#f8e08a' }, rows: [
    '....o....', '...oyo...', '..oyhyo..', '..ohyyo..', '..oyyyo..', '.oyyyyyo.', 'ooooooooo', '...oyo...', '....o....'] },
  bread: { pal: { o: O, b: '#d8944a', h: '#f2c86a' }, rows: [
    '.........', '..ooooo..', '.obhbhbo.', 'obhbhbhbo', 'obbbbbbbo', 'obbbbbbbo', '.ooooooo.', '.........', '.........'] },
  forge: { pal: { o: O, m: '#4a7ab8', s: '#e8f0f8', g: '#e8b040' }, rows: [
    '....o....', '...oso...', 'oooosoooo', 'ommmsmmmo', 'ommmsmmmo', '.ommsmmo.', '.ommgmmo.', '..omgmo..', '...ooo...'] },
  potion: { pal: { o: O, k: '#8a5a3a', g: '#c8d0d8', r: '#d84a6a', h: '#f8a0b8' }, rows: [
    '...ooo...', '...oko...', '...ogo...', '..ogggo..', '.orhrrro.', '.ohrrrro.', '.orrrrro.', '..ooooo..', '.........'] },
  flower: { pal: { o: O, p: '#f07aa0', y: '#f6e070', g: '#5aa04a' }, rows: [
    '..oo.oo..', '.oppoppo.', '.opyyypo.', '..oyyyo..', '.oppoppo.', '..oo.oo..', '....g....', '...ggg...', '....g....'] },
  helmet: { pal: { o: O, s: '#a8b0c0', h: '#e8f0f8', r: '#c83a3a' }, rows: [
    '....r....', '...oro...', '..osssso.', '.oshssso.', '.osssssso', '.ooooooo.', '.os.o.so.', '.os...so.', '.oo...oo.'] },
  home: { pal: { o: O, r: '#d07a38', w: '#f2d8a8', d: '#8a5a34' }, rows: [
    '....o....', '...oro...', '..orrro..', '.orrrrro.', 'ooooooooo', '.owwowwo.', '.owwowwo.', '.owwdwwo.', '.ooooooo.'] },
  bed: { pal: { o: O, w: '#f8f0e8', b: '#5a7ac0', k: '#8a5a34' }, rows: [
    '.........', '.........', 'o........', 'okwoooooo', 'okwbbbbbo', 'ookkkkkko', 'o.......o', '.........', '.........'] },
  star: { pal: { o: O, y: '#f8d070' }, rows: [
    '....o....', '...oyo...', 'oooyyyooo', '.oyyyyyo.', '..oyyyo..', '.oyyoyyo.', '.oyo.oyo.', '.oo...oo.', '.........'] },
  fish: { pal: { o: O, b: '#6aa0d0', w: '#ffffff', h: '#a8d0f0' }, rows: [
    '.........', '..oooo...', '.ohhhhoo.', 'obwbbbbbo', 'obbbbbbo.', '.obbbboo.', '..oooo..o', '.........', '.........'] },
  castle: { pal: { o: O, s: '#a8a8b8', d: '#5a5a6a' }, rows: [
    'o.o...o.o', 'ooo...ooo', 'oso.o.oso', 'osoooooso', 'ossssssso', 'osssdssso', 'ossdddsso', 'ossdddsso', 'ooooooooo'] },
  book: { pal: { o: O, r: '#8a3a3a', w: '#f8f0e0' }, rows: [
    '.........', 'ooooooooo', 'orrrorrro', 'orwwowwro', 'orwwowwro', 'orwwowwro', 'orrrorrro', 'ooooooooo', '.........'] },
  wheat: { pal: { o: O, y: '#e8c050', g: '#8a9a3a' }, rows: [
    '..o.o.o..', '.oyoyoyo.', '.oyoyoyo.', '..oyyyo..', '...oyo...', '...ogo...', '...ogo...', '..ooooo..', '.........'] },
  bow: { pal: { o: O, k: '#a8743a', w: '#f8f0e0' }, rows: [
    '..oo.....', '.okko....', 'okw.ko...', 'ok.w.ko..', 'ok..w.o..', 'ok.w.ko..', 'okw.ko...', '.okko....', '..oo.....'] },
  anchor: { pal: { o: O, s: '#6a7a8a' }, rows: [
    '...ooo...', '...o.o...', '...ooo...', '.ooosooo.', '....s....', 'os..s..so', 'oss.s.sso', '.ossssso.', '..ooooo..'] },
  hall: { pal: { o: O, s: '#d8d0c0', d: '#8a7a6a' }, rows: [
    '....o....', '..ooooo..', '.ooooooo.', 'ooooooooo', '.osdsdso.', '.osdsdso.', '.osdsdso.', 'ooooooooo', 'ooooooooo'] },
};

// 건물 이름 → 휘장. 앞에서부터 처음 맞는 것
const RULES = [
  [/종탑/, 'bell'], [/빵/, 'bread'], [/대장간/, 'forge'], [/잡화|상점|상인/, 'potion'], [/꽃/, 'flower'],
  [/초소|병영|망루|경비/, 'helmet'], [/우리 집/, 'home'], [/여관|하숙|숙소/, 'bed'], [/사당/, 'star'],
  [/생선|어부/, 'fish'], [/성$|탑|대청/, 'castle'], [/기록/, 'book'], [/방앗|창고/, 'wheat'], [/활/, 'bow'],
  [/항구지기|선착/, 'anchor'], [/전당|회관/, 'hall'],
];
export const iconFor = (name) => (name ? RULES.find(([re]) => re.test(name))?.[1] ?? null : null);
