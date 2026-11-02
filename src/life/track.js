// 걸은 거리를 모았다가 20칸마다 생활 상태에 반영한다 (매 프레임 저장하지 않게)
import { WorldMemory } from '../core/world/WorldMemory.js';
import { walk, freshLife } from './life.js';
import { countAction, freshFarm } from '../farm/farm.js';
import { HIDDEN_SKILLS } from '../../content/farm/farm.js';

const STEP = 20; // 칸

export function trackWalk(scene, _dt) {
  const p = scene.player;
  if (!p || !WorldMemory.run) return;
  const last = scene._walkFrom ?? { x: p.x, y: p.y };
  const d = Math.hypot(p.x - last.x, p.y - last.y) / 16;
  scene._walkFrom = { x: p.x, y: p.y };
  if (d > 3) return; // 순간이동(장면 전환·테스트)은 걸음이 아니다
  scene._walked = (scene._walked ?? 0) + d;
  if (scene._walked >= STEP) {
    WorldMemory.setLife(walk(WorldMemory.run.life ?? freshLife(), STEP));
    // 많이 걸으면 열리는 히든 스킬
    const { farm, unlocked } = countAction(WorldMemory.run.farm ?? freshFarm(), 'walk', STEP);
    WorldMemory.setFarm(farm);
    if (unlocked && scene.ui) scene.ui.bubbles.narrate(p, `히든 스킬 [${HIDDEN_SKILLS[unlocked].grade}] ${HIDDEN_SKILLS[unlocked].name} — ${HIDDEN_SKILLS[unlocked].desc}`, 4000);
    scene._walked -= STEP;
  }
}
