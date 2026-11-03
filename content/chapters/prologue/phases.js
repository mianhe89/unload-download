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

// 배경 주민 배치를 짧게 쓰는 도우미: { id: [x, y, mode, radius] }
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));

const FEST_DONE = ['ev.hort', 'ev.tom', 'ev.rine', 'ev.per', 'ev.mia'];
const PREP_DONE = ['ev.prep.eda', 'ev.prep.hort', 'ev.prep.tom', 'ev.prep.rine', 'ev.prep.per', 'ev.prep.selena'];

export const phases = {
  // ── 수확제 전날 (낮) ──────────────────────────
  // 이야기는 평화에서 시작한다. 어두운 일은 하나도 일어나지 않는다(기획서 '평화에서 시작').
  // 마을을 돌며 축제 준비를 돕고, 특히 에다와 정을 붙인다(내일 밤의 반지로 이어진다).
  prep: {
    place: '수확제 전날',
    time: 'day',
    bonfire: 'out',
    player: { at: [16, 28], face: 'up' },
    objective: '축제 준비 돕기',
    npcs: {
      mia: { at: [24, 20], mode: 'idle', face: 'down' },
      eda: { at: [36, 16], mode: 'idle', face: 'down' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [33, 21], mode: 'wander', radius: 1 },
      rine: { at: [28, 13], mode: 'idle', face: 'down' },
      per: { at: [20, 21], mode: 'idle', face: 'right' },
      selena: { at: [36, 28], mode: 'idle', face: 'up' },
      // 배경 주민: 축제를 준비하는 낮
      ...villagers({
        chief: [22, 15, 'wander', 2], granny: [28, 21, 'idle'], kid: [26, 18, 'wander', 3], farmer: [11, 21, 'idle'],
        hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [14, 19, 'wander', 2], oldman: [29, 16, 'idle'],
      }),
    },
    onEnter: 'prep.intro',
    events: [
      { id: 'prep.eda', trigger: { zone: 'smithy' }, run: 'prep.eda' },
      // 에다의 심부름: 호르트에게 탄 빵을 받아다 준다 (호르트가 지워졌으면 이 심부름은 없다)
      { id: 'prep.eda_bread', when: { ifFlag: 'eda.asked', unlessErased: 'hort' }, trigger: { near: 'hort', r: 3 }, run: 'prep.eda_bread' },
      { id: 'prep.eda_thanks', when: { ifFlag: 'got.burnt' }, trigger: { near: 'eda', r: 2 }, run: 'prep.eda_thanks' },
      { id: 'prep.hort', when: { unlessErased: 'hort' }, trigger: { near: 'hort', r: 3 }, run: 'prep.hort' },
      { id: 'prep.tom', when: { unlessErased: 'tom' }, trigger: { near: 'tom', r: 3 }, run: 'prep.tom' },
      {
        id: 'prep.rine', when: { unlessErased: 'rine' }, run: 'prep.rine',
        trigger: {
          dwell: 'rine', r: 2, seconds: 6,
          ticks: [
            { at: 1, bubble: { who: 'rine', text: '어, 거기 가만히 있어 봐.' } },
            { at: 3.5, bubble: { who: 'rine', text: '머리 둘레 재는 중이야…' } },
          ],
        },
      },
      { id: 'prep.per', when: { unlessErased: 'per' }, trigger: { near: 'per', r: 3 }, run: 'prep.per' },
      { id: 'prep.selena', trigger: { zone: 'post' }, run: 'prep.selena' },

      // 세 군데 이상 도왔으면(또는 시간이 꽤 지나면) 미아가 부른다 → 광장의 미아에게 가면 저녁
      { id: 'prep.ready', when: { unlessFlag: 'prep.ready' }, trigger: { count: PREP_DONE, n: 3 }, run: 'prep.ready' },
      { id: 'prep.ready_timer', when: { unlessFlag: 'prep.ready' }, trigger: { timer: 300 }, run: 'prep.ready' },
      { id: 'prep.end', when: { ifFlag: 'prep.ready' }, trigger: { near: 'mia', r: 3 }, run: 'prep.evening' },
    ],
  },

  // ── 수확제의 밤 ───────────────────────────────
  festival: {
    place: '수확제의 광장',
    time: 'night',
    bonfire: 'lit',
    player: { at: [24, 21], face: 'up' },
    npcs: {
      mia: { at: [22, 21], mode: 'follow' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [27, 19], mode: 'wander', radius: 2 },
      rine: { at: [28, 13], mode: 'wander', radius: 1 },
      per: { at: [21, 19], mode: 'idle', face: 'right' },
      // 배경 주민: 모닥불 주위로 모인 축제 인파
      ...villagers({
        chief: [20, 15, 'idle'], granny: [28, 21, 'idle'], kid: [26, 18, 'wander', 3], farmer: [12, 20, 'idle'],
        hunter: [39, 18, 'wander', 1], monk: [21, 11, 'idle'], woman: [14, 19, 'wander', 2], oldman: [29, 16, 'idle'],
      }),
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

      // 엿듣는 대화: 배경 주민끼리 나누는 말. 곁에 있어야 들린다 (멀어지면 놓친다)
      { id: 'chat.farm', trigger: { near: 'farmer', r: 3 }, run: 'festival.chat_farm' },
      { id: 'chat.kid', trigger: { near: 'granny', r: 2 }, run: 'festival.chat_kid' },

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
    bonfire: 'embers',
    player: { at: [16, 28], face: 'up' },
    objective: '에다의 대장간',
    npcs: {
      mia: { at: [26, 19], mode: 'idle', face: 'down' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [33, 21], mode: 'wander', radius: 1 },
      rine: { at: [28, 13], mode: 'idle', face: 'down' },
      per: { at: [20, 21], mode: 'idle', face: 'down' },
      selena: { at: [36, 28], mode: 'idle', face: 'up' },
      // 배경 주민: 축제 다음 날의 일상
      ...villagers({
        chief: [24, 14, 'wander', 2], granny: [28, 21, 'idle'], kid: [13, 23, 'wander', 2], farmer: [11, 21, 'idle'],
        hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [20, 23, 'idle'], oldman: [30, 18, 'idle'],
      }),
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
      { id: 'chat.smithy', trigger: { near: 'oldman', r: 3 }, run: 'morning.chat_smithy' },
      { id: 'chat.bells', trigger: { near: 'kid', r: 2 }, run: 'morning.chat_bells' },
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
    bonfire: 'out',
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

export const firstPhase = 'prep';
