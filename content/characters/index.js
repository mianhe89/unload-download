// 등장인물 목록. 새 캐릭터는 파일을 추가하고 여기에 등록한다.
import me from './me.js';
import mia from './mia.js';
import selena from './selena.js';
import lu from './lu.js';
import eda from './eda.js';
import hort from './hort.js';
import tom from './tom.js';
import rine from './rine.js';
import per from './per.js';
import keeper from './keeper.js';

export const characters = { me, mia, selena, lu, eda, hort, tom, rine, per, keeper };

// 로드 시 지워질 수 있는 사람(동점일 때 이 순서)
export const ERASE_ORDER = ['hort', 'tom', 'rine', 'per'];
