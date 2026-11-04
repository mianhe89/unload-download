// 마을의 동물들. 그림은 content/art/animals.js. 말을 걸면(E) 울고, 거듭 건드리면 관심을 잃었다가 시간이 지나면 다시 반긴다.
// 가방의 먹을 것을 건네면 받아먹는다(좋아하는 것이면 더 반긴다).
//   SPECIES_INFO[종] = { name, sounds, bored, likes: [아이템], fed: { liked, other } }
//   ANIMALS[맵 id] = [{ id, species, at: [x, y], radius? }]   id는 그 맵에서 하나
export const SPECIES_INFO = {
  cat: { name: '고양이', sounds: ['야옹.', '냐아~', '(꼬리를 바닥에 탁탁 친다)', '(빵 냄새 쪽을 본다)'], likes: ['honeybread'], fed: { liked: '(정신없이 먹는다. 다 먹고 다리에 몸을 비빈다)', other: '(킁킁… 먹긴 먹는다)' } },
  dog: { name: '개', sounds: ['멍!', '멍멍!', '(꼬리를 세차게 흔든다)', '(발치에 앉아 올려다본다)'], likes: ['honeybread', 'chestnut'], fed: { liked: '(한입에 삼키고 꼬리를 흔든다) 멍!', other: '(킁킁댄다)' } },
  chicken: { name: '닭', sounds: ['꼬꼬.', '꼬끼오!', '(땅을 콕콕 쫀다)', '(고개를 갸웃한다)'], likes: ['chestnut'], fed: { liked: '(부스러기를 콕콕 쪼아 먹는다)', other: '(쳐다보지도 않는다)' } },
  pig: { name: '돼지', sounds: ['꿀꿀.', '꿀꿀꿀!', '(코를 벌름거린다)', '(진흙에 몸을 비빈다)'], likes: ['honeybread', 'chestnut'], fed: { liked: '(순식간에 먹어 치운다) 꿀꿀!', other: '(그것도 먹는다)' } },
  cow: { name: '소', sounds: ['음매.', '음메에~', '(천천히 되새김질한다)', '(꼬리로 파리를 쫓는다)'], likes: [], fed: { liked: '음매.', other: '(냄새만 맡고 고개를 돌린다)' } },
};
export const BORED = '(관심이 없는 듯하다…)';

export const ANIMALS = {
  village: [
    { id: 'cat', species: 'cat', at: [17, 18], radius: 2 },     // 빵집 앞 길고양이
    { id: 'dog', species: 'dog', at: [21, 28], radius: 2 },     // 우리 집 근처 떠돌이 개
    { id: 'hen1', species: 'chicken', at: [8, 24], radius: 2 }, // 허수아비 옆 마당
    { id: 'hen2', species: 'chicken', at: [10, 25], radius: 2 },
    { id: 'pig', species: 'pig', at: [6, 24], radius: 1 },
    { id: 'cow', species: 'cow', at: [13, 25], radius: 1 },
  ],
  neighbor: [
    { id: 'hen1', species: 'chicken', at: [12, 16], radius: 2 }, { id: 'hen2', species: 'chicken', at: [14, 17], radius: 2 },
  ],
  frost: [{ id: 'dog', species: 'dog', at: [22, 16], radius: 3 }],
  harbor: [{ id: 'cat1', species: 'cat', at: [13, 11], radius: 2 }, { id: 'cat2', species: 'cat', at: [16, 13], radius: 2 }],
  mill: [
    { id: 'hen1', species: 'chicken', at: [11, 15], radius: 2 }, { id: 'hen2', species: 'chicken', at: [13, 17], radius: 2 },
    { id: 'pig', species: 'pig', at: [30, 17], radius: 1 },
  ],
};
