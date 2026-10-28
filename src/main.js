import Phaser from 'phaser';
import { platform } from './platform/index.js';
import TitleScene from './scenes/TitleScene.js';
import StoryScene from './scenes/StoryScene.js';

// 웹판(UNLOAD)은 저해상도, 데스크톱판(DOWNLOAD)은 고해상도.
// 웹판의 해상도 한계는 '좁은 세계의 증상'이라는 설정으로 연출에 쓴다.
const resolution = platform.isDesktop ? { width: 1920, height: 1080 } : { width: 960, height: 540 };

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0b0b10',
  width: resolution.width,
  height: resolution.height,
  pixelArt: !platform.isDesktop,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, StoryScene],
});
