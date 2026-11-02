// 마을 밖 길 맵. 전체 지도(content/world/world.js)의 칸 하나를 걸어 다닌다.
// 이야기 컷신은 없고(아직), 기후·빛·떨어지는 것만 있다. 맵 끝 출구를 밟으면 이웃 칸으로.
// 시작 마을 칸으로 돌아가면 이야기 필드(Field)로 돌아간다.
import Phaser from 'phaser';
import { ZOOM } from '../../config/game.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { season } from '../../core/util/daily.js';
import { HUBS, BIOMES, cellKey } from '../../../content/world/world.js';
import { buildArea, OPPOSITE } from '../../world/buildArea.js';
import { MapRenderer } from '../../field/MapRenderer.js';
import { Player } from '../../field/Player.js';
import { Lighting } from '../../field/Lighting.js';
import { Ambient } from '../../field/Ambient.js';

const HOME = cellKey('surface', HUBS.home.at);
const FACE = { n: 'down', s: 'up', w: 'right', e: 'left' };
const FALLING = { snow: 'snow', leaf: 'leaf', rain: 'rain' };

export default class AreaScene extends Phaser.Scene {
  constructor() { super('Area'); }

  // layer, at: 전체 지도의 칸. entry: 들어오는 쪽. back: 마을로 돌아갈 때의 { chapter, phase, time }
  init({ layer = 'surface', at, entry, back }) {
    this.layerId = layer;
    this.at = at;
    this.entryDir = entry;
    this.back = back;
    this.leaving = false;
  }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui = this.scene.get('UI');
    const area = (this.area = buildArea(this.layerId, this.at, { season: season(new Date()) }));
    this.key = area.key;

    this.map = new MapRenderer(this, area, { open: area.exits.map((e) => e.dir) });
    this.add.image(0, 0, this.map.renderGround('area.ground')).setOrigin(0).setDepth(-1000);
    this.map.placeObjects();

    const [tx, ty] = area.entry(this.entryDir);
    this.player = new Player(this, tx, ty, FACE[this.entryDir] ?? 'down');

    const time = this.back?.time ?? 'day';
    const erased = WorldMemory.world.erased.length;
    this.lighting = new Lighting(this, { time, lights: [], erasedCount: erased, spots: area.spots, width: this.map.width, height: this.map.height });
    this.ambient = new Ambient(this, { time, map: area, erasedCount: erased, falling: FALLING[BIOMES[area.biome].falling] ?? null });

    const cam = this.cameras.main;
    cam.setZoom(ZOOM).setBounds(0, 0, this.map.width, this.map.height).startFollow(this.player.sprite, true, 0.15, 0.15).setRoundPixels(true);
    cam.fadeIn(350, 0, 0, 0);

    // 처음 와 본 곳이면 그곳의 설명이 허공에 떠오른다
    const first = !WorldMemory.run.flags[`visited.${this.key}`];
    WorldMemory.setFlag(`visited.${this.key}`);
    this.time.delayedCall(0, () => {
      this.ui.toScreen = (x, y) => this.worldToScreen(x, y);
      this.ui.bubbles.clear();
      this.ui.hud.setPlace(area.name);
      this.ui.hud.setObjective(null);
      this.ui.hud.showPrompt(null);
      if (first && area.note) this.ui.bubbles.narrate(this.player, area.note, 4200);
    });
  }

  update(_, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.player.update(dt, (x, y) => this.area.isSolidPx(x, y));
    this.player.sync();
    this.lighting.follow(this.player.x, this.player.y);
    this.lighting.update(dt);
    if (this.leaving) return;
    const e = this.area.exitAt(this.player.x, this.player.y);
    if (e) this.go(e);
  }

  go(exit) {
    this.leaving = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(380, () => {
      if (exit.to === HOME && this.back) {
        // 시작 마을로: 이야기 필드로 돌아간다 (들어오는 쪽 = 이 출구의 반대편)
        this.scene.start('Field', { chapter: this.back.chapter, phase: this.back.phase, entry: OPPOSITE[exit.dir] });
        return;
      }
      this.scene.restart({ layer: this.layerId, at: exit.at, entry: OPPOSITE[exit.dir], back: this.back });
    });
  }

  worldToScreen(x, y) {
    const cam = this.cameras.main;
    return { x: (x - cam.worldView.x) * cam.zoom, y: (y - cam.worldView.y) * cam.zoom };
  }
}
