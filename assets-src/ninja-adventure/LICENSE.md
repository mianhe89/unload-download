# Ninja Adventure Asset Pack — 원본 파일

이 폴더는 **수정하지 않은 원본**만 둔다. 게임에 쓰는 이미지는 `npm run assets`가 여기서 읽어 재채색·합성한 뒤 `public/assets/gen/`에 만든다.

| 항목 | 내용 |
| --- | --- |
| 제작 | pixel-boy (Pixel-boy & AAA) |
| 원본 | https://pixel-boy.itch.io/ninja-adventure-asset-pack |
| 라이선스 | **CC0 1.0** (퍼블릭 도메인 헌정). 개인·상업 이용, 수정, 재배포 모두 자유. 출처 표기 의무 없음 |
| 라이선스 확인 | 제작자 공지 문구 "Everything is free with CC0 license for personal and commercial use." |
| 받은 경로 | itch.io가 작업 환경에서 막혀 있어, 팩을 그대로 포함한 공개 GitHub 프로젝트(`discover3d/DejanPopov__NinjaAdventure-Godot4.4-GDscript`의 `Assets/`)에서 받았다 |
| 원본 동일성 확인 | 제작자 공식 리포 `github.com/pixel-boy/ninjaadventure`에 있는 같은 파일(TilesetFloor, TilesetVillageAbandoned, SamuraiBlue 스프라이트)과 바이트 단위로 일치함을 확인 (2026-11-02) |

CC0라 출처 표기 의무는 없지만, 크레딧에는 감사의 뜻으로 제작자를 적는다.

## 이 폴더에 둔 파일

- `Backgrounds/Tilesets/` 바닥(자동 타일), 바닥 장식, 집, 자연, 생활 소품
- `Backgrounds/Animated/` 깃발, 풍차 날개
- `Actor/Characters/<이름>/` 캐릭터 스프라이트시트(16×16, 4방향 × 7줄)와 얼굴(38×38). 우리 캐릭터의 바탕으로 쓴다
- `FX/` 불꽃·잎·불티 파티클, 안개, 연기

파일을 더 쓰려면 원본 팩에서 같은 경로로 복사해 넣고 이 목록을 갱신한다.
- `Ui/Emote/` 감정 말풍선 30장(14×13). 머리 위·대화창 얼굴 옆에 뜬다(`content/art/emotes.js`). 같은 공개 프로젝트의 `Assets/Ui/Emote/`에서 받았다(2026-11-05)
