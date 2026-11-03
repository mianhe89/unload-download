// 이벤트 CG 한 장을 화면 가득(비율 유지, 넘치는 쪽을 자름) 띄운다. 대화창 아래, 필드·HUD 위.
// 인물 CG는 배경 위에 인물 일러스트를 오른쪽에 세운다(content/cg.js의 bg, figure).
import { CG, TINTS } from '../../content/cg.js';

export class CgLayer {
  constructor(scene) {
    this.scene = scene;
    this.layer = null;
    this.id = null;
    this.figure = null; // 지금 CG에 서 있는 인물 id. 대화창은 같은 인물을 겹쳐 세우지 않는다
  }

  show(id, tint) {
    if (id === this.id) return Promise.resolve();
    const def = CG[id] ?? {};
    const key = `cg.${def.bg ?? id}`;
    if (!this.scene.textures.exists(key)) { console.warn('CG 없음', id); return Promise.resolve(); }
    const old = this.layer;
    const { width, height } = this.scene.scale;
    const img = this.scene.add.image(width / 2, height / 2, key);
    img.setScale(Math.max(width / img.width, height / img.height));
    const t = TINTS[tint];
    if (t?.color) img.setTint(t.color);
    const parts = [img];
    if (t?.dim) parts.push(this.scene.add.rectangle(0, 0, width, height, 0x05060c, t.dim).setOrigin(0));
    let figure = null;
    const fkey = `portrait.${def.figure}`;
    if (def.figure && this.scene.textures.exists(fkey)) {
      // 발끝은 화면 밖, 얼굴은 대화창 위에 오게
      figure = this.scene.add.image(width * 0.7, height * 1.04, fkey).setOrigin(0.5, 1);
      figure.setScale((height * 1.04) / figure.height);
      if (t?.color) figure.setTint(t.color);
      parts.push(figure);
    }
    const layer = this.scene.add.container(0, 0, parts).setDepth(70).setAlpha(0);
    this.layer = layer;
    this.id = id;
    this.figure = figure ? def.figure : null;
    if (figure) {
      const x = figure.x;
      figure.x += width * 0.03;
      this.scene.tweens.add({ targets: figure, x, duration: 700, ease: 'Cubic.easeOut' });
    }
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: layer, alpha: 1, duration: 600,
        onComplete: () => { old?.destroy(); resolve(); },
      });
    });
  }

  hide() {
    const layer = this.layer;
    if (!layer) return Promise.resolve();
    this.layer = null;
    this.id = null;
    this.figure = null;
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: layer, alpha: 0, duration: 500, onComplete: () => { layer.destroy(); resolve(); } });
    });
  }
}
