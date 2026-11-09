// 플레이어 조작: 이동 입력과 '가만히 있던 시간' 측정(idle 이벤트용).
// 같은 방향키를 빠르게 두 번 누르면 달린다. 방향키를 모두 떼면 다시 걷는다. 대각선(W+A 등)은 같은 속도로 걷는다.
import Phaser from 'phaser';
import { Actor } from './Actor.js';
import { KEYS, PLAYER_SPEED, RUN_SPEED, RUN_TAP } from '../config/game.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { skinOf } from '../life/life.js';
import { equipSkin } from '../art/equipLook.js';
import { Touch } from '../ui/touch.js';

export class Player extends Actor {
  constructor(scene, tx, ty, face) {
    super(scene, 'me', tx, ty, face, equipSkin(scene, skinOf(WorldMemory.run?.life), WorldMemory.run?.equip)); // 체형·장비가 도트에 보인다
    const kb = scene.input.keyboard;
    this.keys = Object.fromEntries(Object.entries(KEYS).map(([k, list]) => [k, list.map((c) => kb.addKey(c))]));
    this.idleTime = 0;
    this.frozen = false;
    this.running = false;
    // 짧게 톡 친 키: Phaser는 키를 떼는 순간 JustDown을 지워서, 한 프레임 안에 눌렀다 뗀 키(느린 기기·빠른 손)를 놓친다.
    // 누른 것을 따로 적어 두고 그 프레임 안에 한 번 쓴다(멈춰 있는 동안 누른 것은 버린다)
    this.taps = {};
    for (const [name, list] of Object.entries(this.keys)) for (const key of list) key.on('down', () => { this.taps[name] = true; });
    // 한 프레임이 끝나면 비운다: 그 프레임에 읽지 않은 누름(대사 넘기기 등)이 쌓였다가 뒤늦게 말을 걸지 않게
    const clear = () => { this.taps = {}; };
    scene.events.on('postupdate', clear);
    scene.events.once('shutdown', () => scene.events.off('postupdate', clear));
    const lastTap = {};
    for (const dir of ['up', 'down', 'left', 'right']) {
      for (const key of this.keys[dir]) {
        key.on('down', () => {
          const now = scene.time.now / 1000;
          if (now - (lastTap[dir] ?? -9) < RUN_TAP) this.running = true;
          lastTap[dir] = now;
        });
      }
    }
  }

  // 키보드와 터치(가상 조이스틱·E 버튼)를 함께 본다
  pressed(name) { return this.keys[name].some((k) => k.isDown) || Touch.pressed(name); }
  justPressed(name) {
    const tapped = Boolean(this.taps[name]);
    delete this.taps[name];
    const down = this.keys[name].map((k) => Phaser.Input.Keyboard.JustDown(k)).some(Boolean); // 둘 다 읽어 비운다
    return tapped || down || (name === 'act' && Touch.takeAct());
  }

  // 8방향 자유 이동. 누르는 대로 바로 꺾이되, 출발·멈춤은 아주 짧게 가속·감속해 미끄러지듯 자연스럽다.
  // 게임패드가 있으면 왼쪽 스틱으로 아날로그 이동(기울인 만큼 빠르게)
  update(dt, blocked) {
    if (this.frozen) { this.taps = {}; this.running = false; this.vel = { x: 0, y: 0 }; this.move(0, 0, blocked); return; }
    let ix = 0, iy = 0;
    if (this.pressed('left')) ix -= 1;
    if (this.pressed('right')) ix += 1;
    if (this.pressed('up')) iy -= 1;
    if (this.pressed('down')) iy += 1;
    const pad = this.scene.input.gamepad?.pad1;
    if (pad && Math.hypot(pad.leftStick.x, pad.leftStick.y) > 0.2) { ix = pad.leftStick.x; iy = pad.leftStick.y; }
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }
    if (!len) this.running = false;
    const speed = PLAYER_SPEED * (this.running ? RUN_SPEED : 1);
    this.vel ??= { x: 0, y: 0 };
    const k = Math.min(1, dt * (len ? 18 : 22));
    this.vel.x += (ix * speed - this.vel.x) * k;
    this.vel.y += (iy * speed - this.vel.y) * k;
    if (Math.hypot(this.vel.x, this.vel.y) < 4 && !len) this.vel = { x: 0, y: 0 };
    if (this.sprite.anims) this.sprite.anims.timeScale = this.running ? 1.8 : 1;
    this.move(this.vel.x * dt, this.vel.y * dt, blocked);
    this.idleTime = this.moving ? 0 : this.idleTime + dt;
  }
}
