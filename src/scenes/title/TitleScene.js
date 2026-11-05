// 타이틀. 게임 이름은 보여주지 않는다 — 처음 실행하면 무슨 게임인지 알게 된다.
// 화면은 계절의 마을 일러스트(TitleArt): 실제 시각의 빛, 지워진 사람만큼 빠진 색. 흔들림·번쩍임은 없다.
// 일러스트가 없으면 예전처럼 지금 이 순간의 마을(필드 맵)을 그린다.
//   CONTINUE       → 로드. 네다섯 번에 한 번 누군가 지워진다
//   RESET & START  → 진행을 처음부터. 지워진 사람은 돌아오지 않는다(두 번 눌러 확인)
import Phaser from 'phaser';
import { FONT, ZOOM } from '../../config/game.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import * as village from '../../../content/maps/village.js';
import { TILE } from '../../../content/maps/village.js';
import { characters } from '../../../content/characters/index.js';
import { OBJECTS, CHAR } from '../../../content/art/pack.js';
import { MapRenderer } from '../../field/MapRenderer.js';
import { Lighting } from '../../field/Lighting.js';
import { Ambient } from '../../field/Ambient.js';
import { titleSetup } from './titleSetup.js';
import { drawTitleArt } from './TitleArt.js';
import { worldDate } from '../../core/util/worldTime.js';
import { platform } from '../../platform/index.js';
import { chapters } from '../../../content/chapters/index.js';
import { Sound } from '../../core/audio/Sound.js';
import { skinOf } from '../../life/life.js';

const px = (t) => t * TILE + TILE / 2;

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const world = WorldMemory.world;
    const run = WorldMemory.run;
    const setup = (this.setup = titleSetup({
      started: Boolean(run), chapter: run?.chapter, phase: run?.phase,
      erased: world.erased.map((e) => e.id), loads: world.loads,
    }, worldDate(run)));
    this.confirming = false;

    // 일러스트가 있으면 그것으로
    if (drawTitleArt(this, { erased: world.erased.map((e) => e.id), date: worldDate(run) })) {
      this.cameras.main.fadeIn(900, 0, 0, 0);
      this.buildMenu();
      Sound.music(this, 'title');
      Sound.ambient(this, null);
      return;
    }

    // 마을
    const map = new MapRenderer(this, village);
    this.add.image(0, 0, map.renderGround('title.ground')).setOrigin(0).setDepth(-1000);
    map.placeObjects();

    // 사람들: 서 있는 사람, 지워진 사람의 흔적
    for (const p of setup.people) this.addFigure(p.id, p.at, 'down');
    for (const r of setup.remnants) {
      const rem = characters[r.id].remnant;
      if (!rem) continue;
      const def = OBJECTS[rem.prop];
      if (def) this.add.image(px(r.at[0]), px(r.at[1]) + TILE / 2, `sheet.${def.sheet}`, rem.prop).setOrigin(0.5, 1).setDepth(px(r.at[1]) + 8);
      else this.add.image(px(r.at[0]), px(r.at[1]), `prop.${rem.prop}`).setDepth(px(r.at[1]));
    }
    for (const f of setup.figures) this.addFigure(f.id, f.at, 'up');
    if (setup.keeper) {
      const k = this.addFigure('keeper', [24, 11], 'down');
      this.tweens.add({ targets: k, alpha: { from: 0.55, to: 1 }, duration: 1800, yoyo: true, repeat: -1 });
    }

    // 빛과 공기
    this.lighting = new Lighting(this, {
      time: setup.tod,
      lights: setup.bonfire === 'lit' ? [{ spot: 'fire', radius: 90, flicker: true }] : [],
      erasedCount: world.erased.length, spots: village.spots, width: map.width, height: map.height,
    });
    this.ambient = new Ambient(this, { time: setup.tod, bonfire: setup.bonfire, map: village, erasedCount: world.erased.length, falling: setup.falling });

    // 카메라: 오늘 머무는 곳에서 천천히 흐른다
    const cam = this.cameras.main;
    // 가장자리 안개(바깥 FOG칸) 안쪽만 비춘다. 흐르는 폭(DRIFT)까지 셈해 맵 끝이 화면에 들어오지 않게
    const DRIFT = 40;
    const halfW = this.scale.width / ZOOM / 2, halfH = this.scale.height / ZOOM / 2;
    const inner = (village.FOG + 1) * TILE;
    const clamp = (v, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi));
    const cx = clamp(px(setup.view.x), inner + halfW, map.width - inner - halfW - DRIFT);
    const cy = clamp(px(setup.view.y), inner + halfH, map.height - inner - halfH);
    cam.setZoom(ZOOM).setBounds(0, 0, map.width, map.height).setRoundPixels(true);
    cam.centerOn(cx, cy);
    this.tweens.add({ targets: cam, scrollX: cam.scrollX + DRIFT, duration: 14000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    cam.fadeIn(900, 0, 0, 0);

    this.buildMenu();
    Sound.music(this, 'title');
    Sound.ambient(this, null);
  }

  addFigure(id, [tx, ty], dir) {
    this.add.image(px(tx), px(ty) + 1, 'fx.shadow').setDepth(-400).setAlpha(0.55);
    const key = id === 'me' && this.textures.exists(`char.${skinOf(WorldMemory.run?.life)}`) ? `char.${skinOf(WorldMemory.run?.life)}` : `char.${id}`;
    return this.add.image(px(tx), px(ty), key, CHAR.dirs[dir]).setOrigin(0.5, 0.94).setDepth(px(ty));
  }

  // 메뉴와 날짜는 확대되지 않는 별도 카메라로 그린다
  buildMenu() {
    const { width, height } = this.scale;
    const s = width / 960;
    const ui = [];

    // 세계의 날짜: 다운로드 전엔 게임 안 날(n일째), 다운로드 후엔 현실의 날짜
    const d = worldDate(WorldMemory.run);
    const label = platform.isDesktop ? `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}` : WorldMemory.run ? `${WorldMemory.run.time?.day ?? 1}일째` : '';
    ui.push(this.add.text(width - 16 * s, 14 * s, label, {
      fontFamily: FONT, fontSize: `${11 * s}px`, color: '#ffffff',
    }).setOrigin(1, 0).setAlpha(0.7).setShadow(1, 1, '#000', 0));

    // 아래쪽을 살짝 어둡게
    const shade = this.add.graphics();
    for (let i = 0; i < 12; i += 1) { shade.fillStyle(0x000000, 0.04 * (i + 1)); shade.fillRect(0, height - 120 * s + i * 10 * s, width, 10 * s); }
    ui.push(shade);

    const items = [];
    if (WorldMemory.hasRun) items.push({ label: 'CONTINUE', action: () => this.continue() });
    items.push({ label: WorldMemory.hasRun ? 'RESET & START' : 'START', action: (t) => this.reset(t) });
    items.forEach((item, i) => {
      const t = this.add.text(width - 40 * s, height - (items.length - i) * 30 * s - 22 * s, item.label, {
        fontFamily: FONT, fontSize: `${16 * s}px`, color: '#f4f0e8', letterSpacing: 2,
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setShadow(2, 2, '#000', 0);
      t.on('pointerover', () => t.setColor('#c9b8ff'));
      t.on('pointerout', () => t.setColor('#f4f0e8'));
      t.on('pointerdown', () => item.action(t));
      t.base = item.label;
      ui.push(t);
    });

    // 메뉴용 카메라: 확대 없이 위에 겹친다. 월드 카메라는 메뉴를 그리지 않는다
    this.uiCam = this.cameras.add(0, 0, width, height).setName('ui');
    this.cameras.main.ignore(ui);
    this.uiCam.ignore(this.children.list.filter((c) => !ui.includes(c)));
    this.menu = ui;
  }

  update(_, deltaMs) {
    const dt = deltaMs / 1000;
    this.lighting?.update(dt);
  }

  continue() {
    const { run } = WorldMemory.load(); // 네다섯 번에 한 번 누군가 지워진다
    this.go(run.chapter, run.phase, run.where);
  }

  reset(t) {
    if (WorldMemory.hasRun && !this.confirming) {
      this.confirming = true;
      t.setText('PRESS AGAIN TO RESET');
      this.time.delayedCall(2500, () => { this.confirming = false; t.setText(t.base); });
      return;
    }
    const run = WorldMemory.startNew();
    this.go(run.chapter, run.phase);
  }

  // where: 마을 밖 길 맵에서 멈췄으면 그 칸에서 이어간다
  go(chapter, phase, where = null) {
    this.input.enabled = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.uiCam.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      if (where) this.scene.start('Area', { layer: where.layer, at: where.at, entry: 'center', back: { chapter, phase, time: chapters[chapter].phases[phase].time } });
      else this.scene.start('Field', { chapter, phase });
    });
  }
}
