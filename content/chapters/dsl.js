// 대본 작성용 짧은 도우미. 노드 문법은 src/core/script/ScriptRunner.js 참고.
export const N = (say, o = {}) => ({ say, ...o });            // 내레이션
export const T = (who, say, o = {}) => ({ who, say, ...o });   // 대사
export const B = (who, text, o = {}) => ({ bubble: { who, text }, ...o }); // 말풍선
export const keep = (id) => ({ unlessErased: id });           // 그 사람이 남아 있을 때만
export const gone = (id) => ({ ifErased: id });               // 그 사람이 지워졌을 때만
