// 시작 시 한 번: 에셋(public/assets/gen)을 불러오고, 프레임·애니메이션을 등록한 뒤 타이틀로.
import Phaser from 'phaser';
import { loadPackAssets, buildTextures, buildAnimations } from '../core/art/textures.js';
import { Sound } from '../core/audio/Sound.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const manifest = this.registry.get('manifest');
    loadPackAssets(this, manifest);
    Sound.preload(this, this.registry.get('audio'));
    // 불러오기 실패는 콘솔에 남기되 게임은 계속 연다
    this.load.on('loaderror', (file) => console.error(`에셋을 불러오지 못함: ${file.key} (${file.src})`));
  }

  create() {
    buildTextures(this);
    buildAnimations(this);
    this.scene.start('Title');
  }
}
