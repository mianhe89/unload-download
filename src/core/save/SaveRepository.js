// 세이브 저장소. 게임이 아는 저장 창구는 이것 하나다.
// 시작할 때 한 번 비동기로 읽어 메모리에 올리고, 이후 읽기는 동기, 쓰기는 비동기로 흘려보낸다.
// (원격 DB로 바뀌어도 게임 루프가 네트워크를 기다리지 않게 하기 위함)
import { createStorage } from '../storage/index.js';
import { freshSave, migrate } from './SaveSchema.js';

const KEY = 'save';
// 이전 버전(v1)은 'ud.world' 키에 있었다
const LEGACY_KEY = 'world';

class Repository {
  constructor() {
    this.storage = createStorage();
    this.data = freshSave();
    this.pending = Promise.resolve();
  }

  async init() {
    const raw = (await this.storage.read(KEY)) ?? (await this.storage.read(LEGACY_KEY));
    this.data = migrate(raw);
    await this.flush();
    return this.data;
  }

  get() { return this.data; }

  // mutator(data)로 바꾸고 저장을 예약한다
  update(mutator) {
    mutator(this.data);
    this.data.meta.updatedAt = Date.now();
    this.flush();
    return this.data;
  }

  flush() {
    const snapshot = structuredClone(this.data);
    this.pending = this.pending.then(() => this.storage.write(KEY, snapshot));
    return this.pending;
  }

  async wipe() {
    this.data = freshSave();
    await this.storage.remove(LEGACY_KEY);
    await this.flush();
  }
}

export const SaveRepository = new Repository();
