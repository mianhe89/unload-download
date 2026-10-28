// 저장소 어댑터 계약.
// 지금은 브라우저(localStorage)를 쓰고, 나중에 서버 DB나 Tauri 파일 저장으로 바꿀 때
// 이 계약만 지키는 어댑터를 새로 만들어 core/storage/index.js에서 갈아끼운다.
//
// 모든 메서드는 Promise를 돌려준다(원격 DB를 염두에 둔 비동기 계약).
// 게임 로직은 어댑터를 직접 부르지 않고 core/save/SaveRepository.js를 통해서만 쓴다.
//
// interface StorageAdapter {
//   name: string
//   read(key: string): Promise<object | null>
//   write(key: string, value: object): Promise<void>
//   remove(key: string): Promise<void>
// }

export function assertAdapter(a) {
  for (const m of ['read', 'write', 'remove']) {
    if (typeof a?.[m] !== 'function') throw new Error(`StorageAdapter에 ${m}()가 없습니다: ${a?.name}`);
  }
  return a;
}
