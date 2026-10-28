// 시작 시 한 번: 코드로 그린 픽셀 아트를 텍스처·애니메이션으로 올리고 타이틀로.
import Phaser from 'phaser';
import { buildTextures, buildAnimations } from '../core/art/textures.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    buildTextures(this);
    buildAnimations(this);
    this.scene.start('Title');
  }
}
