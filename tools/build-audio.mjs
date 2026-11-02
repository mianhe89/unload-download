// 소리 빌드: 원본(ogg/wav) → 웹용 ogg + m4a. ffmpeg가 없으면 원본을 그대로 복사한다(ogg만).
// 변환은 오래 걸려서 결과를 캐시한다: 원본이 바뀌지 않았으면 다시 만들지 않는다.
// 결과: public/assets/audio/<music|sfx>/<키>.<ext> + public/assets/audio/manifest.json
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { MUSIC, SFX } from '../content/audio/audio.js';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'assets-src/ninja-adventure/Audio');
const OUT = join(ROOT, 'public/assets/audio');

const hasFfmpeg = () => spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
// 캐시: 원본 내용의 해시를 기록해 두고, 같으면 다시 만들지 않는다 (파일 시각에 기대지 않아 CI 캐시에서도 맞다)
const STAMP = join(OUT, 'stamp.json');
const hashOf = (f) => createHash('sha1').update(readFileSync(f)).digest('hex');
let stamp = {};
const fresh = (src, out) => existsSync(out) && stamp[out] === hashOf(src);
const mark = (src, out) => { stamp[out] = hashOf(src); };

function encode(src, out, args) {
  if (fresh(src, out)) return false;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, ...args, out]);
  if (r.status !== 0) throw new Error(`ffmpeg 실패: ${src}\n${r.stderr}`);
  mark(src, out);
  return true;
}

export function buildAudio({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const ff = hasFfmpeg();
  mkdirSync(OUT, { recursive: true });
  try { stamp = JSON.parse(readFileSync(STAMP, 'utf8')); } catch { stamp = {}; }
  const manifest = { music: {}, sfx: {}, formats: ff ? ['ogg', 'm4a'] : ['orig'] };
  let made = 0;
  for (const [kind, list] of [['music', MUSIC], ['sfx', SFX]]) {
    mkdirSync(join(OUT, kind), { recursive: true });
    for (const [key, v] of Object.entries(list)) {
      const rel = typeof v === 'string' ? v : v.src;
      const src = join(SRC, rel);
      if (!existsSync(src)) throw new Error(`소리 원본 없음: ${rel}`);
      if (ff) {
        // 음악: 스테레오 80kbps / 효과음: 모노 64kbps
        const ogg = kind === 'music' ? ['-c:a', 'libvorbis', '-q:a', '1'] : ['-ac', '1', '-c:a', 'libvorbis', '-q:a', '0'];
        const m4a = kind === 'music' ? ['-c:a', 'aac', '-b:a', '80k'] : ['-ac', '1', '-c:a', 'aac', '-b:a', '64k'];
        if (encode(src, join(OUT, kind, `${key}.ogg`), ogg)) made += 1;
        if (encode(src, join(OUT, kind, `${key}.m4a`), m4a)) made += 1;
        manifest[kind][key] = [`${kind}/${key}.ogg`, `${kind}/${key}.m4a`];
      } else {
        const ext = extname(rel);
        const out = join(OUT, kind, `${key}${ext}`);
        if (!fresh(src, out)) { copyFileSync(src, out); mark(src, out); }
        manifest[kind][key] = [`${kind}/${key}${ext}`];
      }
    }
  }
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  writeFileSync(STAMP, JSON.stringify(stamp));
  log(`소리 빌드 완료 → public/assets/audio (음악 ${Object.keys(MUSIC).length}, 효과음 ${Object.keys(SFX).length}, ${ff ? `새로 변환 ${made}개` : 'ffmpeg 없음: 원본 복사'})`);
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) buildAudio();
