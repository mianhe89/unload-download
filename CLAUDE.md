# UNLOAD / DOWNLOAD

Phaser 4 + Vite 웹 RPG, 데스크톱은 Tauri. 스토리 스포일러가 있는 private 리포다.

## 작업 전에 항상 읽을 문서

- @README.md — 개요, 실행 방법
- @docs/구현.md — 폴더 구조, 지워짐 규칙, 페이즈·이벤트·대본 문법, 저장 구조, 콘텐츠 추가 방법
- @docs/기획서.md — 세계관, 스토리, 반전, 시스템, MVP 범위
- @docs/스토리.md — 막·날짜별 줄거리, 퀘스트 목록, 인물 나이와 역할
- @docs/아트디렉션.md — 픽셀 규칙, 팔레트 키, 캐릭터 시트

새 기능이나 콘텐츠는 기획서의 의도와 구현.md의 규칙(trigger 종류, 대본 노드, 조건 문법)에 맞춘다. 문서와 코드가 어긋나면 코드를 기준으로 확인하고 사용자에게 알린다.

## 명령

```bash
npm run dev        # http://localhost:5173 (에셋 빌드가 먼저 돈다)
npm run validate   # 콘텐츠 검증 (대본·페이즈·맵·소프트락)
npm test           # 단위 테스트 (vitest)
npm run build      # 웹 빌드 → dist/
npm run check      # validate + test + build 한 번에
```

## 규칙

- **개연성이 가장 중요하다.** 모든 대사·사건·장소·물건은 세계 안에서 이유가 있어야 한다. 대사는 그 인물이 지금 왜 그 말을 하는지 플레이어가 알 수 있어야 하고, 앞 장면을 모르면 뜻이 안 통하는 말(맥락 없는 농담 반복, 반전 단어만 흘리는 말)은 쓰지 않는다. 빵 냄새가 나면 근처에 빵집이 보여야 한다.

- `content/`를 고치면 `npm run validate`를 돌린다. 코드를 고치면 `npm run check`(검증·테스트·빌드)까지 확인한다.
- 구조나 문법이 바뀌면 `docs/구현.md`를, 이야기가 바뀌면 `docs/스토리.md`를 같이 갱신한다.
- 작업은 `main` 하나에서 한다(혼자 개발). 예전 갈래는 태그 `archive/field-overhaul`에 보관돼 있고, 필요한 것만 main으로 옮긴다.
- 세이브 구조를 바꾸면 `src/core/save/SaveSchema.js`의 `VERSION`을 올리고 `MIGRATIONS`에 변환을 추가한다.
- 새 필드 기능은 `src/field/systems/`에 부품으로 만들고 `FieldScene`에는 붙이는 줄만 넣는다.
- 외부 그림·소리·글꼴을 넣으면 `CREDITS.md`에 출처·규약·쓰는 곳을 적는다. 임시 소재는 임시라고 표시한다.
- 문서와 주석은 한국어, 기존 문서의 `-다` 체를 따른다.
