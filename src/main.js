import Phaser from 'phaser';
import 'galmuri/dist/galmuri.css';
import { VIEW, FONT } from './config/game.js';
import { platform } from './platform/index.js';
import { SaveRepository } from './core/save/SaveRepository.js';
import { Sound } from './core/audio/Sound.js';
import { mountSoundButton } from './ui/SoundButton.js';
import { wantsTouch } from './ui/touch.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/title/TitleScene.js';
import FieldScene from './scenes/field/FieldScene.js';
import UIScene from './scenes/field/UIScene.js';
import AreaScene from './scenes/area/AreaScene.js';
import BattleScene from './scenes/battle/BattleScene.js';

async function start() {
  // 세이브를 먼저 읽고(나중에 원격 DB여도 같은 흐름), 픽셀 폰트가 준비된 뒤 게임을 연다
  await SaveRepository.init();
  try { await document.fonts.load(`16px ${FONT}`); } catch { /* 폰트 실패 시 기본 글꼴 */ }
  // 에셋 목록 (npm run assets가 만든다)
  const manifest = await fetch('assets/gen/manifest.json').then((r) => {
    if (!r.ok) throw new Error('assets/gen/manifest.json 없음 — npm run assets를 먼저 실행하세요');
    return r.json();
  });

  // 소리 목록 (없어도 게임은 연다 — 소리만 안 난다)
  const audio = await fetch('assets/audio/manifest.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);

  // 개발·테스트용 핸들 (브라우저 콘솔에서 __game)
  window.__game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#0b0b10',
    width: VIEW.width,
    height: VIEW.height,
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TitleScene, FieldScene, AreaScene, BattleScene, UIScene],
    callbacks: { preBoot: (game) => { game.registry.set('manifest', manifest); game.registry.set('audio', audio); } },
  });
  document.title = platform.isDesktop ? 'DOWNLOAD' : 'UNLOAD';
  // M: 소리 끄기/켜기 (어느 장면에서든)
  window.addEventListener('keydown', (e) => { if (e.key === 'm' || e.key === 'M') Sound.toggleMute(); });
  // 휴대폰엔 M 키가 없으니 화면 구석에 소리 버튼을 띄운다. 컴퓨터에선 HUD의 [M] 키캡을 누르면 된다
  if (wantsTouch()) mountSoundButton();
}

start();
