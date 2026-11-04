// 감정 말풍선(이모트): 인물 머리 위에 작게 톡 뜨는 그림. 팩(Ninja Adventure, CC0)의 Ui/Emote 30장(14×13).
// 원본은 assets-src/ninja-adventure/Ui/Emote/emoteN.png. 게임에서는 텍스처 'emote.<이름>'.
// 기획서의 말랑 블롭 SD(인물마다 다른 그림)가 생기기 전까지 이 팩 그림으로 감정을 보여 준다.
export const EMOTES = {
  shock: 1, nervous: 2, dizzy: 3, angry: 4, blank: 5, grin: 6, doubt: 7, wink: 8, smug: 9, meh: 10,
  smile: 11, shy: 12, sad: 13, flat: 14, horror: 15, upset: 16, worried: 17, happy: 18, grumble: 19, dots: 20,
  notice: 21, alert: 22, question: 23, someone: 24, confused: 25, heartbreak: 26, love: 27, sleep: 28, star: 29, cross: 30,
};

// 대사의 [mood=..] 표정 → 이모트 (일러스트가 없는 인물도 감정이 보이게)
export const MOOD_EMOTE = {
  smile: 'smile', laugh: 'grin', happy: 'happy', shy: 'shy', sad: 'sad', angry: 'angry',
  surprised: 'shock', hurt: 'heartbreak', worried: 'worried',
};

// 선물 반가움(-1~2) → 이모트
export const GIFT_EMOTE = { 2: 'love', 1: 'happy', 0: 'flat', '-1': 'nervous' };

export const emoteFile = (name) => `Ui/Emote/emote${EMOTES[name]}.png`;
