// 챕터 목록. 새 챕터는 폴더(phases.js + script.js)를 만들고 여기에 등록한다.
// 거점 마을에 들르는 페이즈(content/places)는 마을 밖 길이 열린 장(1장부터)마다 함께 넣는다.
import * as prologue from './prologue/phases.js';
import { script as prologueScript } from './prologue/script.js';
import * as ruin from '../places/ruin.js';
import * as frost from '../places/frost.js';
import * as harbor from '../places/harbor.js';
import * as dwarf from '../places/dwarf.js';
import * as elfPlace from '../places/elf.js';
import * as chapter1 from './chapter1/phases.js';
import { script as chapter1Script } from './chapter1/script.js';
import * as chapter2 from './chapter2/phases.js';
import { script as chapter2Script } from './chapter2/script.js';
import * as chapter3 from './chapter3/phases.js';
import { script as chapter3Script } from './chapter3/script.js';
import * as chapter4 from './chapter4/phases.js';
import { script as chapter4Script } from './chapter4/script.js';

const PLACES = [ruin, frost, harbor, dwarf, elfPlace];
const withPlaces = (c) => ({
  ...c,
  phases: { ...c.phases, ...Object.assign({}, ...PLACES.map((p) => p.phases)) },
  script: { ...c.script, ...Object.assign({}, ...PLACES.map((p) => p.script)) },
});

export const chapters = {
  prologue: { title: '수확제 다음 날', phases: prologue.phases, firstPhase: prologue.firstPhase, script: prologueScript },
  chapter1: withPlaces({ title: '지워진 이름들', phases: chapter1.phases, firstPhase: chapter1.firstPhase, script: chapter1Script }),
  chapter2: withPlaces({ title: '안개 너머', phases: chapter2.phases, firstPhase: chapter2.firstPhase, script: chapter2Script }),
  chapter3: withPlaces({ title: '겨울 준비', phases: chapter3.phases, firstPhase: chapter3.firstPhase, script: chapter3Script }),
  chapter4: withPlaces({ title: '소집 가는 길', phases: chapter4.phases, firstPhase: chapter4.firstPhase, script: chapter4Script }),
};
