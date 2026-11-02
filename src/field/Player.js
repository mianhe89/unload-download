// 플레이어 조작: 이동 입력과 '가만히 있던 시간' 측정(idle 이벤트용).
import Phaser from 'phaser';
import { Actor } from './Actor.js';
import { KEYS, PLAYER_SPEED } from '../config/game.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { skinOf } from '../life/life.js';
import { Touch } from '../ui/touch.js';

export class Player extends Actor {
  constructor(scene, tx, ty, face) {
    super(scene, 'me', tx, ty, face, skinOf(WorldMemory.run?.life)); // 체형이 도트에 보인다
    const kb = scene.input.keyboard;
    this.keys = Object.fromEntries(Object.entries(KEYS).map(([k, list]) => [k, list.map((c) => kb.addKey(c))]));
    this.idleTime = 0;
    this.frozen = false;
  }

  // 키보드와 터치(가상 조이스틱·E 버튼)를 함께 본다
  pressed(name) { return this.keys[name].some((k) => k.isDown) || Touch.pressed(name); }
  justPressed(name) { return this.keys[name].some((k) => Phaser.Input.Keyboard.JustDown(k)) || (name === 'act' && Touch.takeAct()); }

  update(dt, blocked) {
    if (this.frozen) { this.move(0, 0, blocked); return; }
    let vx = 0, vy = 0;
    if (this.pressed('left')) vx -= 1;
    if (this.pressed('right')) vx += 1;
    if (this.pressed('up')) vy -= 1;
    if (this.pressed('down')) vy += 1;
    const len = Math.hypot(vx, vy) || 1;
    const step = PLAYER_SPEED * dt;
    this.move((vx / len) * step, (vy / len) * step, blocked);
    this.idleTime = this.moving ? 0 : this.idleTime + dt;
  }
}
