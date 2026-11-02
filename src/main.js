import Phaser from 'phaser';
import 'galmuri/dist/galmuri.css';
import { VIEW, FONT } from './config/game.js';
import { platform } from './platform/index.js';
import { SaveRepository } from './core/save/SaveRepository.js';
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
    callbacks: { preBoot: (game) => game.registry.set('manifest', manifest) },
  });
  document.title = platform.isDesktop ? 'DOWNLOAD' : 'UNLOAD';
}

start();
