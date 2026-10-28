// 프롤로그의 페이즈: 어디서, 누가, 무슨 일이 '일어날 수 있는가'.
// 좌표는 타일 단위(content/maps/village.js). 지워진 인물은 배치되지 않고 흔적(remnant)이 남는다.
//
// 이벤트 = 조건(when) + 계기(trigger) + 실행할 컷신(run). 한 번 실행되면 끝(once 기본).
// 선택창은 없다. 무엇을 줍고, 어디에 머물고, 누구 곁에 서 있었는지가 갈림길이다.
//
// trigger 종류
//   { near: 인물|장소, r }                 그 근처에 가면 (r: 타일)
//   { zone: 구역 }                         구역에 들어서면
//   { timer: 초 }                          페이즈 시작 후 n초
//   { afterFlag: 이름, delay: 초 }         플래그가 켜지고 n초 뒤
//   { dwell: 인물, r, seconds, ticks }     그 곁에 누적 n초 머물면 (ticks: 도중 말풍선)
//   { idle: 초, near: 인물, r, minTime }   그 곁에서 가만히 n초 있으면
//   { pickedAll: 묶음, near?, r? }         흩어진 물건을 다 주웠으면 (+그 사람 곁에 가면)
//   { count: [플래그...], n }              플래그 중 n개 이상 켜지면

const FEST_DONE = ['ev.hort', 'ev.tom', 'ev.rine', 'ev.per', 'ev.mia'];

export const phases = {
  // ── 수확제의 밤 ───────────────────────────────
  festival: {
    place: '수확제의 광장',
    time: 'night',
    player: { at: [24, 21], face: 'up' },
    npcs: {
      mia: { at: [22, 21], mode: 'follow' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [27, 19], mode: 'wander', radius: 2 },
      rine: { at: [28, 13], mode: 'wander', radius: 1 },
      per: { at: [21, 19], mode: 'idle', face: 'right' },
    },
    lights: [{ spot: 'fire', radius: 90, flicker: true }],
    onEnter: 'festival.intro',
    events: [
      { id: 'hort.spill', when: { unlessErased: 'hort' }, trigger: { near: 'hort', r: 4 }, run: 'festival.hort_spill' },
      { id: 'hort.thanks', when: { unlessErased: 'hort', ifFlag: 'bread.spilled' }, trigger: { pickedAll: 'bread', near: 'hort', r: 2 }, run: 'festival.hort_thanks' },

      { id: 'tom.spark', when: { unlessErased: 'tom' }, trigger: { timer: 45 }, run: 'festival.spark' },
      { id: 'tom.stomp', when: { unlessErased: 'tom' }, trigger: { pickedAll: 'spark' }, run: 'festival.spark_you' },

      { id: 'rine.wind', when: { unlessErased: 'rine' }, trigger: { near: 'rine', r: 4 }, run: 'festival.rine_wind' },
      { id: 'rine.crown', when: { unlessErased: 'rine', ifFlag: 'crown.blown' }, trigger: { pickedAll: 'crown', near: 'rine', r: 2 }, run: 'festival.rine_crown' },

      {
        id: 'per.song', when: { unlessErased: 'per' }, run: 'festival.per_song',
        trigger: {
          dwell: 'per', r: 3, seconds: 14,
          ticks: [
            { at: 2, bubble: { who: 'per', text: '♪ 북쪽 끝, 해가 들지 않는 검은 성에' } },
            { at: 6, bubble: { who: 'per', text: '♪ 마왕이 산다네' } },
            { at: 10, bubble: { who: 'per', text: '♪ 그를 베는 자, 잃어버린 것을 되찾으리' } },
          ],
        },
      },

      { id: 'mia.quiet', trigger: { idle: 8, near: 'mia', r: 2, minTime: 25 }, run: 'festival.mia_quiet' },

      { id: 'eda.count', when: { unlessFlag: 'eda.met' }, trigger: { count: FEST_DONE, n: 2 }, run: 'festival.eda' },
      { id: 'eda.timer', when: { unlessFlag: 'eda.met' }, trigger: { timer: 150 }, run: 'festival.eda' },
      { id: 'bells', trigger: { afterFlag: 'eda.met', delay: 18 }, run: 'festival.bells' },
    ],
  },

  // ── 다음 날 아침 ───────────────────────────────
  morning: {
    place: '광장 · 아침',
    time: 'day',
    player: { at: [16, 28], face: 'up' },
    objective: '에다의 대장간',
    npcs: {
      mia: { at: [26, 19], mode: 'idle', face: 'down' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [33, 21], mode: 'wander', radius: 1 },
      rine: { at: [28, 13], mode: 'idle', face: 'down' },
      per: { at: [20, 21], mode: 'idle', face: 'down' },
      selena: { at: [36, 28], mode: 'idle', face: 'up' },
      // 셀레나와 이야기한 뒤에 나타난다 (컷신에서 등장, 이어하기 시엔 여기서 배치)
      lu: { at: [10, 28], mode: 'idle', face: 'right', when: { ifFlag: 'selena.done' } },
    },
    props: [
      { prop: 'burntBread', at: [14, 16], when: { unlessErased: 'hort' }, text: '진열대 구석, 탄 빵만 따로 모아둔 바구니. 호르트 아저씨도 왜 모아뒀는지 모른다.' },
      { prop: 'ironCrown', at: [29, 14], when: { unlessErased: 'rine' }, text: '주인 없는 화관. 서툴게 두드린 쇠꽃이 하나 엮여 있다.' },
      { prop: 'ring', at: [39, 17], text: '모루 옆, 쇠를 두드린 자국. 먼지가 손가락 한 마디만큼 쌓였는데, 자국만은 어제 것 같다.' },
    ],
    onEnter: 'morning.intro',
    events: [
      { id: 'smithy', trigger: { zone: 'smithy' }, run: 'morning.smithy' },
      { id: 'mia', when: { ifFlag: 'smithy.seen' }, trigger: { near: 'mia', r: 3 }, run: 'morning.mia' },
      { id: 'selena', when: { ifFlag: 'mia.talked' }, trigger: { zone: 'post' }, run: 'morning.selena' },
      { id: 'lu', when: { ifFlag: 'selena.done' }, trigger: { near: 'lu', r: 3 }, run: 'morning.lu' },
    ],
  },

  // ── 그날 밤 ───────────────────────────────────
  night: {
    place: '종탑 · 밤',
    time: 'night',
    player: { at: [24, 20], face: 'up' },
    objective: '종탑',
    npcs: {},
    lights: [{ spot: 'towerDoor', radius: 50, flicker: false }],
    onEnter: 'night.intro',
    events: [
      { id: 'keeper', trigger: { zone: 'tower' }, run: 'night.keeper' },
    ],
  },
};

export const firstPhase = 'festival';
