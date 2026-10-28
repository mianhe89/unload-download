// 프롤로그 임시 스크립트. requires: 해당 인물이 지워지면 그 대사는 사라진다.
export const prologue = [
  { text: '수확제 밤, 종탑의 종이 한 번 더 울렸다. 아무도 세지 않았다.' },
  { speaker: '빵집 아저씨', requires: 'baker', text: '어이, 오늘은 빵 안 사 가나?' },
  { speaker: '경비병 톰', requires: 'guard_tom', text: '대장간 쪽이 조용하군. 원래 이 시간엔 망치 소리가 났던 것 같은데.' },
  { text: '대장간 문은 잠겨 있었다. 안은 텅 비어 있었다.' },
  { speaker: '나', text: '…여기, 누가 살았었지?' },
  { text: '그 이름을 기억하는 사람은 이제 나 하나뿐이었다.' },
];
