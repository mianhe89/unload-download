// 시작 시 한 번: 에셋(public/assets/gen)을 불러오고, 프레임·애니메이션을 등록한 뒤 타이틀로.
import Phaser from 'phaser';
import { loadPackAssets, buildTextures, buildAnimations } from '../core/art/textures.js';
import { Sound } from '../core/audio/Sound.js';
import { CG, PORTRAITS } from '../../content/cg.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const manifest = this.registry.get('manifest');
    loadPackAssets(this, manifest);
    Sound.preload(this, this.registry.get('audio'));
    // 이벤트 CG와 인물 일러스트(표정 차분 포함). 파일이 없으면 그 그림만 빠지고 게임은 연다
    for (const [id, cg] of Object.entries(CG)) if (cg.file) this.load.image(`cg.${id}`, `assets/${cg.file}`);
    // 타이틀 일러스트 (계절: 겨울은 따로)
    this.load.image('titleart.base', 'assets/title/village.jpg');
    this.load.image('titleart.winter', 'assets/title/winter.jpg');
    for (const [id, p] of Object.entries(PORTRAITS)) {
      this.load.image(`portrait.${id}`, `assets/${p.file}`);
      for (const [face, file] of Object.entries(p.faces ?? {})) this.load.image(`portrait.${id}.${face}`, `assets/${file}`);
      // 호감도 단계 그림 (content/portraits/portraits.js)
      for (const [st, v] of Object.entries(p.stages ?? {})) {
        if (v.file) this.load.image(`portrait.${id}@${st}`, `assets/${v.file}`);
        for (const [face, file] of Object.entries(v.faces ?? {})) this.load.image(`portrait.${id}@${st}.${face}`, `assets/${file}`);
      }
    }
    // 불러오기 실패는 콘솔에 남기되 게임은 계속 연다
    this.load.on('loaderror', (file) => console.error(`에셋을 불러오지 못함: ${file.key} (${file.src})`));
  }

  create() {
    buildTextures(this);
    buildAnimations(this);
    this.scene.start('Title');
  }
}
