# UNLOAD / DOWNLOAD

겉은 중세 판타지, 속은 SF인 서브컬처 스토리 RPG.
웹(UNLOAD)에서 엔딩까지 무료로 즐기고, 엔딩에서 게임을 '다운로드'하는 행위 자체가 이야기의 클라이맥스가 된다.

> 이 리포는 스토리 스포일러를 포함하므로 **private**로 유지한다.

- 기획서: [docs/기획서.md](docs/기획서.md)

## 구조

```
/
├─ docs/             기획서, 시나리오, 세계관 설정
├─ src/              Phaser 게임 본체 (웹/EXE 공통)
│  ├─ scenes/        타이틀, 프롤로그(비주얼노벨)
│  ├─ systems/       WorldMemory: 로드할 때마다 누군가 지워지는 핵심 메카닉
│  └─ platform/      웹(UNLOAD) / 데스크톱(DOWNLOAD) 분기
├─ data/story/       스토리 스크립트
├─ public/assets/    일러스트, 사운드
└─ src-tauri/        Tauri 설정 (EXE 빌드)
```

## 실행

필요: Node.js 20+

```bash
npm install
npm run dev      # 웹판 개발 서버 http://localhost:5173
npm run build    # 웹판 빌드 → dist/
```

## EXE 빌드 (Windows)

추가로 필요: [Rust](https://rustup.rs), Microsoft C++ Build Tools, WebView2(Windows 10/11 기본 포함)

```bash
npm run tauri dev     # 데스크톱 창으로 실행
npm run tauri build   # 설치 파일/EXE → src-tauri/target/release/
```

## 현재 상태

- 타이틀 → 프롤로그 대사 진행, 대사마다 자동 저장
- '이어하기'(로드)를 할 때마다 마을 사람이 한 명씩 지워지고, 그 사람의 대사가 프롤로그에서 사라짐
- 웹은 960×540, 데스크톱은 1920×1080 해상도로 분기
