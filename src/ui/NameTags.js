// 사람 머리 위 이름. 가까이(7칸 안)에 있는 사람만, 흰 글자에 어두운 테두리. 대화·컷신 중에도 그대로 보인다.
import { text, scaleOf } from './kit.js';

const RANGE = 7 * 16;

export class NameTags {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.pool = [];
  }

  tag(i) {
    if (!this.pool[i]) {
      const t = text(this.scene, 0, 0, '', { size: 9, bold: true, color: '#fbf8f2' }).setOrigin(0.5, 1).setDepth(43);
      t.setStroke('#1a1418', 3 * this.s);
      this.pool[i] = t;
    }
    return this.pool[i];
  }

  update(toScreen) {
    const sc = this.scene;
    const f = ['Field', 'Area'].map((k) => sc.scene.isActive(k) && sc.scene.get(k)).find((x) => x?.nameTagsInfo);
    const list = (toScreen && f?.nameTagsInfo?.(RANGE)) ?? [];
    list.forEach((n, i) => {
      const p = toScreen(n.x, n.y);
      this.tag(i).setText(n.name).setColor(n.color ?? '#fbf8f2').setPosition(Math.round(p.x), Math.round(p.y)).setVisible(true);
    });
    for (let i = list.length; i < this.pool.length; i += 1) this.pool[i].setVisible(false);
  }
}
