// 한국어 조사: 앞 글자의 받침에 맞춰 고른다. josa('붕대', '을/를') → '붕대를'
export function hasFinal(word) {
  const c = String(word).trim().slice(-1).charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}
export const josa = (word, pair) => { const [a, b] = pair.split('/'); return `${word}${hasFinal(word) ? a : b}`; };
