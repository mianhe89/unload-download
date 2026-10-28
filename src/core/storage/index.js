// 어떤 저장소를 쓸지 고르는 곳. 확장 시 여기만 바꾼다.
//   웹판           → LocalStorageAdapter
//   데스크톱판     → (추후) TauriFileAdapter: 게임 폴더에 세이브 파일. 메타 연출에 필요
//   계정·서버 연동 → (추후) RemoteAdapter: REST/DB. 오픈베타 이후
import { assertAdapter } from './StorageAdapter.js';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';
import { MemoryAdapter } from './MemoryAdapter.js';

export function createStorage() {
  if (typeof localStorage === 'undefined') return assertAdapter(new MemoryAdapter());
  return assertAdapter(new LocalStorageAdapter());
}
