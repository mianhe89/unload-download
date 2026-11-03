// 단서 수첩. 진행하며 알게 된 것을 모아 두고 수첩(J)에서 다시 읽는다. 마음의 수치 대신 '무엇을 알게 되었나'를 남긴다.
//   { id, title, text, when: 대본 조건 }  when이 맞는 순간 수첩에 적힌다(한 번 적히면 남는다).
//   text는 주인공이 적어 둔 메모처럼 쓴다. 그때 알 수 있는 것만 쓴다(앞질러 반전을 흘리지 않는다).
export const CLUES = [
  { id: 'clue.ring', title: '거친 쇠반지', when: { ifFlag: 'has.ring' },
    text: '수확제 밤, 에다가 내 손바닥에 올려 준 반지. 테두리가 아직 거칠다. 다음 날 아침 대장간에 오면 마무리해 주겠다고 했다.' },
  { id: 'clue.bells', title: '한 번 더 울린 종', when: { ifFlag: 'done.bells' },
    text: '자정에 종이 열두 번 울리고, 한 번 더 울렸다. 사람들은 열둘까지만 셌다. 나만 그 소리를 셌다.' },
  { id: 'clue.smithy', title: '빈 대장간', when: { ifFlag: 'smithy.seen' },
    text: '약속한 아침, 대장간은 텅 비어 있었다. 화로는 몇 년은 불을 지피지 않은 것처럼 차갑다. 미아는 대장간이 원래 비어 있었다고 한다.' },
  { id: 'clue.ledger', title: '명부의 빈 줄', when: { ifFlag: 'selena.done' },
    text: '셀레나의 주민 명부에 에다의 이름이 없다. 대신 지운 자국도 긁은 자국도 없는 빈 줄이 하나 있다. 셀레나는 줄을 비워 두는 사람이 아니다.' },
  { id: 'clue.edge', title: '이름이 떠오르지 않는 옆 마을', when: { ifFlag: 'done.lu' },
    text: '떠돌이 마법사 루가 물었다. 옆 마을 이름이 뭐냐고. 대답할 수 없었다. 마을을 둘러싼 숲 너머가 안개처럼 뭉개져 있다. 늘 그랬다고 생각했는데.' },
  { id: 'clue.keeper', title: '종탑 앞의 그림자', when: { ifFlag: 'done.keeper' },
    text: '밤의 종탑 앞에서 빗자루를 든 그림자를 만났다. 쓸어 낸 먼지에서 대장간의 그을음 냄새가 났다. "나는 치울 뿐이야. 어지르는 건 내가 아니야."' },
  { id: 'clue.burnt_bread', title: '탄 빵 바구니', when: { ifFlag: 'talked.prologue.morning.hort' },
    text: '호르트 아저씨는 탄 빵만 따로 모아 둔 바구니가 있다. 왜 모아 두는지 본인도 모른다. 에다는 아침마다 탄 쪽만 골라 갔다.' },
  { id: 'clue.iron_flower', title: '쇠꽃이 엮인 화관', when: { ifFlag: 'talked.prologue.morning.rine' },
    text: '리네의 꽃집에 주인 없는 화관이 하나 남았다. 서툴게 두드린 쇠꽃이 엮여 있다. 리네는 누가 주문했는지 기억하지 못한다.' },
];
