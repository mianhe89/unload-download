// 소리 목록 (Ninja Adventure 팩, CC0). 원본은 assets-src/ninja-adventure/Audio에 그대로 두고,
// npm run assets가 ffmpeg로 웹용(ogg + m4a, 낮은 비트레이트)으로 바꿔 public/assets/audio에 둔다.
// 사파리는 ogg가 불안정해 m4a도 함께 만든다 — Phaser가 브라우저에 맞는 쪽을 고른다.

// 음악: 키 → 원본 경로 (Audio/ 아래)
export const MUSIC = {
  title: 'Musics/9 - Quiet.ogg',
  festival: 'Musics/36 - Village.ogg',
  morning: 'Musics/33 - Calm Village.ogg',
  night: 'Musics/14 - Curse.ogg',
  aftermath: 'Musics/26 - Lost Village.ogg',
  road: 'Musics/23 - Road.ogg',
  forest: 'Musics/37 - Dark Forest.ogg',
  frost: 'Musics/29 - Lament.ogg',
  snow: 'Musics/13 - Mystical.ogg',
  ruins: 'Musics/30 - Ruins.ogg',
  sea: 'Musics/18 - Aquatic.ogg',
  cave: 'Musics/2 - The Cave.ogg',
  lava: 'Musics/21 - Dungeon.ogg',
  castle: 'Musics/10 - Dark Castle.ogg',
  galaxy: 'Musics/19 - Ascension.ogg',
  empty: 'Musics/16 - Melancholia.ogg',
  battle: 'Musics/17 - Fight.ogg',
  boss: 'Musics/28 - Tension.ogg',
};

// 효과음·짧은 곡: 키 → 원본 경로. vol: 기본 음량
export const SFX = {
  ui: { src: 'Sounds/Menu/Accept.wav', vol: 0.35 },
  cancel: { src: 'Sounds/Menu/Cancel.wav', vol: 0.35 },
  hit: { src: 'Sounds/Hit & Impact/Hit1.wav', vol: 0.45 },
  heavy: { src: 'Sounds/Hit & Impact/Impact.wav', vol: 0.55 },
  bell: { src: 'Sounds/Hit & Impact/Impact3.wav', vol: 0.6, detune: -900 },
  tell: { src: 'Sounds/Alert/Alert2.wav', vol: 0.45 },
  heal: { src: 'Sounds/Magic & Skill/Heal.wav', vol: 0.4 },
  skill: { src: 'Sounds/Magic & Skill/Magic1.wav', vol: 0.4 },
  spirit: { src: 'Sounds/Magic & Skill/Spirit.wav', vol: 0.45 },
  pickup: { src: 'Sounds/Bonus/Coin.wav', vol: 0.4 },
  step: { src: 'Sounds/Jump & Bounce/Jump.wav', vol: 0.25 },
  voice: { src: 'Sounds/Voice/Voice1.wav', vol: 0.2 },
  win: { src: 'Jingles/Success1.wav', vol: 0.5 },
  lose: { src: 'Jingles/GameOver.wav', vol: 0.5 },
  secret: { src: 'Jingles/Secret1.wav', vol: 0.55 },
  // 깔리는 소리 (반복)
  wind: { src: 'Sounds/Ambient/Wind.wav', vol: 0.25, loop: true },
  wave: { src: 'Sounds/Ambient/Wave.wav', vol: 0.3, loop: true },
  rain: { src: 'Sounds/Ambient/Rain.wav', vol: 0.25, loop: true },
};

// 이야기 페이즈 → 음악
export const PHASE_MUSIC = { prep: 'morning', festival: 'festival', morning: 'morning', night: 'night', aftermath: 'aftermath', fogroad: 'aftermath', neighbor: 'forest', winter: 'frost', snowfest: 'festival' };

// 길 맵 기후 → 음악, 깔리는 소리
export const BIOME_MUSIC = {
  temperate: 'road', lateAutumn: 'road', coast: 'road', deepForest: 'forest', dry: 'empty',
  frost: 'frost', snow: 'snow', blackSnow: 'castle', desert: 'ruins', volcano: 'lava',
  sea: 'sea', cave: 'cave', deepCave: 'cave', lava: 'lava', ancientHall: 'ruins', galaxy: 'galaxy',
};
export const BIOME_AMBIENT = { frost: 'wind', snow: 'wind', blackSnow: 'wind', coast: 'wave', sea: 'wave' };

// 거점은 기후보다 우선
export const HUB_MUSIC = { empty: 'empty', castle: 'castle', ancient: 'ruins', seaRuins: 'sea', galaxy: 'galaxy', skyShore: 'galaxy' };
