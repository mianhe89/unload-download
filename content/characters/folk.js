// 다른 도시의 사람들 (로웬·아스테라). 한 파일에 모아 둔다 — 이야기의 중심은 아니지만 도시를 붐비게 한다(background).
// 그림은 팩 인물에 색을 바꾸고 실루엣이 달라지는 덧그림(두건·망토·깃털·왕관)을 얹었다(같은 바탕을 쓰려면 덧그림이 있어야 한다).
// lines: 그 도시에 들렀을 때 E로 말 걸면 하는 대화(content/talk/talk.js가 합친다). 그때 알 수 있는 것만 말한다.
const P = (id, name, role, age, color, home, sprite, lines) => ({ id, name, role, age, color, erasable: false, background: true, home, sprite, silhouette: role, bubbles: {}, remnant: null, lines });
const S = (base, shareBase, recolor, edits) => ({ base, shareBase, recolor, edits });

export const FOLK = {
  // ── 로웬 (교역 도시) ──
  orban: P('orban', '오르반', '상인 조합장', 56, '#d8b060', 'trade', S('Noble', 'chief', { '4e484a': '8a6a2a', '3b3643': '5a4418' }, [{ type: 'crown' }]),
    [['북쪽 길이 끊긴 뒤로 조합 장부가 반쪽이 됐네.', '[mood=neutral]국경 마을과 거래하던 상단이 [y]통째로[/y] 소식이 없어.'], ['[mood=smile]견습 기사로군. 우리 상단 호위 일이 있으면 말하지.']]),
  rico: P('rico', '리코', '거리의 악사', 27, '#e08a6a', 'trade', S('Boy', 'me', { d14b34: 'c8743a', '965340': '8a4a22', e3f1f5: 'e8c8a0', '548789': 'a85a3a' }, [{ type: 'feather' }]),
    [['♪ 분수 앞에선 노래가 두 배로 울려.', '[mood=smile]마왕 토벌 노래? 그거 [y]요즘 제일 잘 팔려[/y].'], ['페르 영감? 그 노래 원조라던 할아범 말이지. [mood=neutral]뒷소절은 아무도 안 불러.']]),
  mai: P('mai', '마이', '과일 장수', 24, '#f0a050', 'trade', S('Woman', 'rine', { '548789': 'c87a3a', '79b8ce': 'f0a860' }, [{ type: 'headband', color: 'f0d070' }]),
    [['사과 사세요! [mood=smile]남쪽 과수원 거예요.', '분수에 동전 던지면 [y]소원[/y]이 이뤄진대요. 난 매일 던져요.']]),
  devon: P('devon', '데본', '천 장수', 45, '#8a6ab0', 'trade', S('Villager3', 'farmer', { '56864c': '6a4a8a', a8a129: '9a7ac0' }, [{ type: 'cape', color: '5a3a7a', dark: '3a2450' }]),
    [['보랏빛 천은 마법 도시에서 와. [mood=neutral]숲 너머, 엘프 마을보다 더 깊은 데.'], ['[mood=sad]마이가 내 조카야. 언니가 국경 마을로 시집갔는데… [w=300]요즘 편지가 없어.']]),
  barbara: P('barbara', '바바라', '여관 주인', 48, '#c89070', 'trade', S('OldWoman', 'granny', { a5608b: '8a5a4a', d3a2c0: 'c8a090', '548789': '6a4a3a', '2d697b': '4a3428' }, [{ type: 'headband', color: 'f4ead6' }]),
    [['「은빛 분수」에 어서 와요. [mood=smile]방은 넉넉해요. 요즘 북쪽 손님이 뚝 끊겨서.'], ['소집 가는 기사들이 다음 달엔 몰려오겠지. 국을 [y]두 솥[/y] 끓여 둬야겠어.']]),
  nina: P('nina', '니나', '여관 딸', 19, '#f08aa0', 'trade', S('Princess', 'mia', {}, [{ type: 'headband', color: 'e86a8a' }]),
    [['[mood=shy]기사님이세요? …견습이요? 그래도 멋있어요.'], ['엄마가 분수 동전은 [y]주워 오면 안 된대요[/y]. 소원 훔치는 거라고.']]),
  karl: P('karl', '카를', '로웬 경비병', 36, '#7a8aa0', 'trade', S('Knight', 'tom', { '4e484a': '5a6a8a', '3b3643': '3a4a6a' }, [{ type: 'cape', color: '3a4a7a', dark: '24305a' }]),
    [['로웬 경비대다. 분수 광장에서 소매치기 조심해라.'], ['[mood=neutral]북쪽에서 오는 피난민이 늘었다. 악마가 마을을 [y]비운다[/y]더군.']]),
  mateo: P('mateo', '마테오', '로웬 경비병', 23, '#8a9ab0', 'trade', S('Knight', 'tom', { '4e484a': '6a7a9a', '3b3643': '4a5a7a' }, [{ type: 'feather' }]),
    [['[mood=smile]여기 분수는 영주님이 놓아 주신 거래. 물이 [y]산에서[/y] 내려와.'], ['나도 견습부터 시작했어. 루라는 마법사한테 굴렀다고? [mood=laugh]그 사람 유명해.']]),
  paul: P('paul', '폴', '방앗간 일꾼', 38, '#b0a070', 'trade', S('Inspector', 'hort', { a3754e: 'b0a070', '91522c': '7a6a3a' }, [{ type: 'headband', color: '8a6a3a' }]),
    [['밀가루 자루 나르는 게 일이야.', '[mood=neutral]올해는 들판 밀이 다 [y]군량[/y]으로 간대.']]),
  ida: P('ida', '이다', '폴의 아내', 35, '#d0a0b0', 'trade', S('Villager2', 'woman', { '4a5270': '8a5a6a', '548789': 'b88a9a' }, [{ type: 'headband', color: 'f0c0d0' }]),
    [['미로가 분수에 빠질 뻔했어요. [mood=angry]세 번째예요, 이번 달만.']]),
  miro: P('miro', '미로', '폴과 이다의 아들', 8, '#f0c060', 'trade', S('Child', 'kid', { '5f7160': '4a8ac0' }, [{ type: 'feather' }]),
    [['분수 물 마셔 봤어? [mood=laugh]차가워!'], ['[mood=smile]형 기사야? 칼 보여 줘!']]),
  heda: P('heda', '헤다', '꽃 파는 할머니', 70, '#e0a0c0', 'trade', S('OldWoman', 'granny', { a5608b: 'c87aa0', d3a2c0: 'f0c0d8', '548789': '6a8a4a', '2d697b': '4a6a3a' }, [{ type: 'crown' }]),
    [['꽃 한 송이 사 가. [mood=smile]고향에 두고 온 사람 주라고.'], ['[mood=sad]우리 영감은 [y]꽃 이름[/y]을 다 외웠는데. 난 반밖에 몰라.']]),

  // ── 아스테라 (마법 도시) ──
  arka: P('arka', '아르카', '탑의 주인', 62, '#b088e0', 'magic', S('SorcererBlack', 'lu', { e0394c: 'e8d8ff', '8f3e56': 'b8a0e0', '4e484a': '3a2a5a', '5f7160': '24183a' }, [{ type: 'crown' }]),
    [['아스테라에 온 걸 환영하네. 숲이 길을 열어 줬다면, 자네는 [y]숲을 해치지 않은[/y] 사람이겠지.'], ['[mood=neutral]루? …그 아이를 아나. [w=300]오래전에 이 탑을 나갔지. 무엇을 붙들려다 그리 됐는지는, 그 아이에게 묻지 말게.']]),
  fio: P('fio', '피오', '견습 마법사', 18, '#8ad0f0', 'magic', S('SorcererBlack', 'lu', { e0394c: '8ad0f0', '8f3e56': '4a90c0', '4e484a': '2a4a6a', '5f7160': '1a3048' }, [{ type: 'feather' }]),
    [['[mood=smile]불꽃 하나 띄우는 데 석 달 걸렸어요.', '수정에 손 대지 마세요! [y]손가락이 얼어요[/y].']]),
  selma: P('selma', '셀마', '견습 마법사', 20, '#f0a0d0', 'magic', S('SorcererBlack', 'lu', { e0394c: 'f0a0d0', '8f3e56': 'c06090', '4e484a': '5a2a4a', '5f7160': '3a1830' }, [{ type: 'headband', color: 'f8e080' }]),
    [['피오가 또 실험 망쳤어요. [mood=angry]서고 책장이 반쯤 탔다고요.'], ['[mood=neutral]마법은 [y]기억하는 일[/y]이래요. 주문은 잊으면 끝이니까.']]),
  onel: P('onel', '오넬', '대서고 사서', 54, '#c8b890', 'magic', S('Monk', 'monk', { '56864c': '5a4a7a', '345a52': '3a2e54' }, [{ type: 'cape', color: '4a3a6a', dark: '2e2448' }]),
    [['대서고에선 조용히. [mood=neutral]책은 소리 없이 기억하네.'], ['북쪽 왕국 연대기가 있네. 그런데 [y]망한 해[/y]의 장만 비어 있어. 찢긴 게 아니라, 처음부터.']]),
  kira: P('kira', '키라', '물약 장수', 31, '#7ae0a0', 'magic', S('Villager4', 'selena', { f1c471: '7ac080', d78b4a: '4a8a5a', d14b34: '8a5ab0', '8f3e56': '5a3a80' }, [{ type: 'headband', color: '7ae0a0' }]),
    [['회복 물약? [mood=smile]진짜 회복 물약은 비싸요. 재료가 [y]세계수 이슬[/y]이라.'], ['화상 연고는 싸요. 견습들이 하도 데어서.']]),
  doran: P('doran', '도란', '수정 깎는 장인', 47, '#a0c0e0', 'magic', S('Hunter', 'hunter', { '4a5270': '4a5a7a', '548789': '6a8ab0', '79b8ce': 'a0c0e0' }, [{ type: 'cape', color: '6a8ab0', dark: '4a6a90' }]),
    [['수정은 깎는 게 아니라 [y]달래는[/y] 거야.', '[mood=neutral]요즘 수정이 자꾸 흐려져. 숲 바깥 어딘가에서 마력이 새고 있어.']]),
  har: P('har', '하르', '별 보는 노인', 77, '#d8d0f0', 'magic', S('OldMan3', 'merchant', { f1c471: 'd8d0f0', '3b3643': '4a3a6a' }, [{ type: 'feather' }]),
    [['밤마다 별을 센다네. [mood=neutral]이상하지, 셀 때마다 [y]하나씩 모자라[/y].'], ['…종소리 같은 걸 들은 적 있나. 아주 먼 데서, 열두 번보다 많이.']]),
  mel: P('mel', '멜', '마법사', 39, '#9a8ad0', 'magic', S('Villager2', 'woman', { '4a5270': '4a3a7a', '548789': '7a6ab0' }, [{ type: 'cape', color: '3a2a6a', dark: '24184a' }]),
    [['솔은 아직 주문 하나 못 외워요. [mood=smile]그래도 [y]꽃은 잘 피워요[/y]. 마법 없이.']]),
  sol: P('sol', '솔', '멜의 딸', 10, '#f0e080', 'magic', S('Child', 'kid', { '5f7160': '8a6ac0' }, [{ type: 'headband', color: 'f0e080' }]),
    [['[mood=smile]이거 봐! 내가 키운 꽃이야. 탑 꼭대기까지 자랄 거야.']]),
  bane: P('bane', '베인', '아스테라 문지기', 44, '#8a7aa0', 'magic', S('Knight', 'tom', { '4e484a': '4a3a6a', '3b3643': '2e2448' }, [{ type: 'cape', color: '6a4aa0', dark: '4a3080' }]),
    [['아스테라 문이다. [mood=neutral]숲이 들여보냈다면 나도 막지 않는다.'], ['[y]도끼[/y]를 든 자는 이 숲에서 길을 잃는다. 기억해 둬라.']]),
};
