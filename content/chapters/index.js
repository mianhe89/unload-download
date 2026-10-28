// 챕터 목록. 새 챕터는 폴더(phases.js + script.js)를 만들고 여기에 등록한다.
import * as prologue from './prologue/phases.js';
import { script as prologueScript } from './prologue/script.js';
import * as chapter1 from './chapter1/phases.js';
import { script as chapter1Script } from './chapter1/script.js';

export const chapters = {
  prologue: { title: '수확제 다음 날', phases: prologue.phases, firstPhase: prologue.firstPhase, script: prologueScript },
  chapter1: { title: '지워진 이름들', phases: chapter1.phases, firstPhase: chapter1.firstPhase, script: chapter1Script },
};
