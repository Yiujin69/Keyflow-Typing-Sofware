// Generates build/icon.png (512×512) with no external dependencies.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const SIZE = 512;
const SS = 2; // supersampling factor
const W = SIZE * SS;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mix = (a, b, t) => a + (b - a) * t;

function roundedRect(x, y, cx, cy, w, h, r) {
  const dx = Math.abs(x - cx) - (w / 2 - r);
  const dy = Math.abs(y - cy) - (h / 2 - r);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - r;
}

function segment(x, y, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = x - x1;
  const wy = y - y1;
  const t = clamp((wx * vx + wy * vy) / (vx * vx + vy * vy), 0, 1);
  return Math.hypot(wx - vx * t, wy - vy * t);
}

function coverage(distance) {
  return clamp(0.5 - distance, 0, 1);
}

function composite(dst, src, alpha) {
  const a = clamp(alpha, 0, 1);
  if (a <= 0) return dst;
  const outA = a + dst[3] * (1 - a);
  if (outA <= 0) return [0, 0, 0, 0];
  return [
    (src[0] * a + dst[0] * dst[3] * (1 - a)) / outA,
    (src[1] * a + dst[1] * dst[3] * (1 - a)) / outA,
    (src[2] * a + dst[2] * dst[3] * (1 - a)) / outA,
    outA,
  ];
}

const buf = new Float32Array(SIZE * SIZE * 4);
const scale = SIZE / W;

function setPixel(x, y, color, alpha) {
  const index = (y * SIZE + x) * 4;
  const current = [buf[index], buf[index + 1], buf[index + 2], buf[index + 3]];
  const next = composite(current, color, alpha);
  buf[index] = next[0];
  buf[index + 1] = next[1];
  buf[index + 2] = next[2];
  buf[index + 3] = next[3];
}

// Downsample by averaging SS×SS blocks.
for (let py = 0; py < SIZE; py += 1) {
  for (let px = 0; px < SIZE; px += 1) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy += 1) {
      for (let sx = 0; sx < SS; sx += 1) {
        const x = px * SS + sx + 0.5;
        const y = py * SS + sy + 0.5;

        // Background: rounded gradient tile.
        const bgDist = roundedRect(x, y, W / 2, W / 2, W - 44, W - 44, 118 * SS);
        const bgA = coverage(bgDist / SS);
        if (bgA > 0) {
          const t = clamp((x + y) / (2 * W), 0, 1);
          const c = [mix(124, 139, t), mix(140, 92, t), mix(255, 246, t), 1];
          // Radial sheen.
          const dx = (x - W * 0.28) / W;
          const dy = (y - W * 0.18) / W;
          const sheen = clamp(1 - Math.hypot(dx, dy) * 2.4, 0, 1) * 0.18;
          const lit = [mix(c[0], 255, sheen), mix(c[1], 255, sheen), mix(c[2], 255, sheen), 1];
          const idx = (px * SIZE + py) * 4;
          const current = [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
          const next = composite(current, lit, bgA);
          buf[idx] = next[0]; buf[idx + 1] = next[1]; buf[idx + 2] = next[2]; buf[idx + 3] = next[3];
        }

        const key1 = roundedRect(x, y, 174 * SS, 172 * SS, 232 * SS, 232 * SS, 50 * SS);
        const key1A = coverage(key1 / SS);
        if (key1A > 0) {
          const idx = (px * SIZE + py) * 4;
          const current = [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
          const next = composite(current, [255, 255, 255], key1A * 0.97);
          buf[idx] = next[0]; buf[idx + 1] = next[1]; buf[idx + 2] = next[2]; buf[idx + 3] = next[3];
        }

        const key2 = roundedRect(x, y, 340 * SS, 342 * SS, 232 * SS, 232 * SS, 50 * SS);
        const key2A = coverage(key2 / SS);
        if (key2A > 0) {
          const idx = (px * SIZE + py) * 4;
          const current = [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
          const next = composite(current, [243, 241, 255], key2A * 0.95);
          buf[idx] = next[0]; buf[idx + 1] = next[1]; buf[idx + 2] = next[2]; buf[idx + 3] = next[3];
        }

        // Letters pressed into the keycaps.
        const ink = [26, 31, 62];
        const kStem = coverage((segment(x, y, 126 * SS, 110 * SS, 126 * SS, 240 * SS) - 16 * SS) / SS);
        const kUpper = coverage((segment(x, y, 130 * SS, 176 * SS, 226 * SS, 112 * SS) - 15 * SS) / SS);
        const kLower = coverage((segment(x, y, 130 * SS, 176 * SS, 230 * SS, 242 * SS) - 15 * SS) / SS);
        const kA = Math.max(kStem, kUpper, kLower);
        if (kA > 0) {
          const idx = (px * SIZE + py) * 4;
          const current = [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
          const next = composite(current, ink, kA);
          buf[idx] = next[0]; buf[idx + 1] = next[1]; buf[idx + 2] = next[2]; buf[idx + 3] = next[3];
        }

        const fStem = coverage((segment(x, y, 288 * SS, 282 * SS, 288 * SS, 400 * SS) - 15 * SS) / SS);
        const fTop = coverage((segment(x, y, 288 * SS, 286 * SS, 380 * SS, 286 * SS) - 14 * SS) / SS);
        const fMid = coverage((segment(x, y, 288 * SS, 342 * SS, 356 * SS, 342 * SS) - 14 * SS) / SS);
        const fA = Math.max(fStem, fTop, fMid);
        if (fA > 0) {
          const idx = (px * SIZE + py) * 4;
          const current = [buf[idx], buf[idx + 1], buf[idx + 2], buf[idx + 3]];
          const next = composite(current, ink, fA);
          buf[idx] = next[0]; buf[idx + 1] = next[1]; buf[idx + 2] = next[2]; buf[idx + 3] = next[3];
        }

        r += buf[(px * SIZE + py) * 4];
        g += buf[(px * SIZE + py) * 4 + 1];
        b += buf[(px * SIZE + py) * 4 + 2];
        a += buf[(px * SIZE + py) * 4 + 3];
      }
    }
    const n = SS * SS;
    const index = (py * SIZE + px) * 4;
    buf[index] = r / n; buf[index + 1] = g / n; buf[index + 2] = b / n; buf[index + 3] = a / n;
  }
}

// Minimal PNG writer.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y += 1) {
  raw[y * (SIZE * 4 + 1)] = 0;
  for (let x = 0; x < SIZE; x += 1) {
    const src = (y * SIZE + x) * 4;
    const dst = y * (SIZE * 4 + 1) + 1 + x * 4;
    raw[dst] = Math.round(buf[src]);
    raw[dst + 1] = Math.round(buf[src + 1]);
    raw[dst + 2] = Math.round(buf[src + 2]);
    raw[dst + 3] = Math.round(buf[src + 3] * 255);
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', png);
console.log('Wrote build/icon.png', png.length, 'bytes');
