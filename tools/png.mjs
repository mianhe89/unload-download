// 의존성 없는 PNG 인코더 (미리보기 도구용)
import { deflateSync } from 'node:zlib';

export function upscale(rgba, w, h, scale) {
  const SW = w * scale, SH = h * scale;
  const raw = Buffer.alloc((SW * 4 + 1) * SH);
  for (let y = 0; y < SH; y += 1) {
    for (let x = 0; x < SW; x += 1) {
      const si = (Math.floor(y / scale) * w + Math.floor(x / scale)) * 4;
      const di = y * (SW * 4 + 1) + 1 + x * 4;
      raw[di] = rgba[si]; raw[di + 1] = rgba[si + 1]; raw[di + 2] = rgba[si + 2]; raw[di + 3] = rgba[si + 3];
    }
  }
  return { raw, width: SW, height: SH };
}

export function png(w, h, raw) {
  const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (buf) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
