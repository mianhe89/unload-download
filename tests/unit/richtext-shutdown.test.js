import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { RichText } from '../../src/ui/RichText.js';

// 글자 객체: 장면이 닫혀 지워진 뒤 setText를 부르면 Phaser처럼 터진다
function fakeScene() {
  const obj = () => {
    const o = { dead: false, destroy() { o.dead = true; } };
    for (const m of ['setOrigin', 'setFontStyle', 'setShadow', 'setVisible', 'setSize', 'setPosition', 'setY']) o[m] = () => o;
    o.setText = () => { if (o.dead) throw new TypeError("Cannot read properties of null (reading 'drawImage')"); return o; };
    return o;
  };
  const events = new EventEmitter();
  return { events, add: { container: () => ({ add() {}, destroy() {} }), text: obj, rectangle: obj } };
}

describe('글자 찍기와 장면 닫기', () => {
  it('찍는 도중 장면이 닫히면 update 구독을 끊는다 — 다시 열었을 때 지운 글자에 찍지 않는다', () => {
    const scene = fakeScene();
    const rt = new RichText(scene, 0, 0, { font: 'x', size: 15, color: '#000', maxWidth: 400 });
    rt.set('아주 긴 대사가 한 글자씩 찍히는 중이다');
    rt.type({ speed: 1000 });
    expect(scene.events.listenerCount('update')).toBe(1);
    rt.parts.forEach((p) => p.text.destroy()); // 장면이 닫히며 글자가 지워진다
    scene.events.emit('shutdown');
    expect(scene.events.listenerCount('update')).toBe(0);
    expect(() => scene.events.emit('update')).not.toThrow();
  });
});
