// 이야기 필드가 쓰는 맵들. 페이즈의 map(기본 'village')으로 고른다.
// hub: 전체 지도(content/world/world.js)의 거점 id — 길 맵에서 이 거점 칸에 들어서면 이 맵으로 들어간다
import * as village from './village.js';
import * as neighbor from './neighbor.js';
import ruin from './ruin.js';
import frost from './frost.js';

export const MAPS = { village, neighbor, ruin, frost };
export const mapOf = (phase) => MAPS[phase?.map ?? 'village'];
