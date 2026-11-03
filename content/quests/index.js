// 퀘스트 목록. 막마다 파일을 하나 두고 여기서 합친다. 다루는 방식은 src/field/systems/Quests.js 맨 위 설명.
//   { id, title, kind: 'main'|'once'|'repeat'|'route'|'choice'|'heart', giver?, offer?: '말 걸면 하는 제안',
//     start?: { when?: 대본 조건, auto?: true },
//     steps: [{ text: '수첩에 보일 글', done: 조건, onDone?: 컷신 라벨 }], reward?: { aff, flag, run } }
//   done 조건: { flag } { talk: 인물 } { zone } { when: 대본 조건 } (여럿 적으면 모두 맞아야 한다)
import { quests as prologue } from './prologue.js';

export const QUESTS = Object.fromEntries([...prologue].map((q) => [q.id, q]));
