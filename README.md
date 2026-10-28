# UNLOAD / DOWNLOAD

겉은 중세 판타지, 속은 SF인 스토리 RPG.
웹(UNLOAD)에서 엔딩까지 무료로 즐기고, 엔딩에서 게임을 '다운로드'하는 행위 자체가 이야기의 클라이맥스가 된다.

> 스토리 스포일러를 포함하므로 이 리포는 **private**로 유지한다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/기획서.md](docs/기획서.md) | 무엇을 만드는가 — 세계관, 스토리, 반전, 시스템, 수익, 로드맵 |
| [docs/구현.md](docs/구현.md) | 어떻게 만들었는가 — 구조, 규칙, 콘텐츠 추가 방법, 저장/확장 |
| [docs/아트디렉션.md](docs/아트디렉션.md) | 그림 규칙 — 픽셀·일러스트·SD 세 겹, 캐릭터 시트, 타이틀 |

## 지금 할 수 있는 것

- 타이틀: 게임 이름 없이, 실제 날짜·시각·계절과 진행 상황에 따라 매번 다르게 그려지는 마을
- 프롤로그 「수확제 다음 날」 전체를 탑다운 필드에서 플레이 (약 10~15분)
- 선택창 없음. 떨어진 빵을 주워주고, 노래를 끝까지 듣고, 곁에 가만히 서 있는 행동이 갈림길
- **CONTINUE를 누를 때마다 가장 마음을 준 마을 사람이 지워진다.** RESET & START로도 돌아오지 않는다
- 프롤로그 후 CONTINUE → 1장 도입: 빈자리와 종탑 벽의 이름들

## 실행

필요: Node.js 20+

```bash
npm install
npm run dev       # http://localhost:5173
```

조작: `WASD`/방향키 이동, `E`/`Space` 살펴보기·대화 넘기기

EXE 빌드(Windows)는 [Rust](https://rustup.rs)와 Microsoft C++ Build Tools가 추가로 필요하다: `npm run tauri build`

## 콘텐츠를 고친 뒤

```bash
node tools/validate-content.mjs
```
