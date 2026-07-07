// Generates icon-192.png and icon-512.png using pure Node.js (no dependencies)
// Writes minimal valid PNG files with the Stemify green circle + S letter

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function writePNG(filePath, size) {
  const w = size, h = size;

  // RGBA pixel buffer
  const buf = Buffer.alloc(w * h * 4, 0);

  // Draw filled green circle (background)
  const cx = w / 2, cy = h / 2, r = w / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      const i = (y * w + x) * 4;
      if (dx * dx + dy * dy <= r * r) {
        buf[i]   = 0x1D; // R (#1DB954 green)
        buf[i+1] = 0xB9; // G
        buf[i+2] = 0x54; // B
        buf[i+3] = 0xFF; // A
      }
    }
  }

  // Draw a simple "S" shape as white pixels (thick bezier approximation)
  const s = size;
  function px(x, y) {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || xi >= w || yi < 0 || yi >= h) return;
    const i = (yi * w + xi) * 4;
    buf[i] = buf[i+1] = buf[i+2] = 0xFF;
    buf[i+3] = 0xFF;
  }
  function fillRect(x, y, rw, rh) {
    for (let dy = 0; dy < rh; dy++)
      for (let dx = 0; dx < rw; dx++)
        px(x + dx, y + dy);
  }
  function arc(cx, cy, rad, t0, t1, steps, thick) {
    for (let i = 0; i <= steps; i++) {
      const t = t0 + (t1 - t0) * i / steps;
      const bx = cx + Math.cos(t) * rad;
      const by = cy + Math.sin(t) * rad;
      fillRect(Math.round(bx - thick/2), Math.round(by - thick/2), thick, thick);
    }
  }

  const m = s * 0.18;         // margin
  const mid = s / 2;
  const hw = s - m * 2;       // usable width
  const T = Math.max(2, Math.round(s * 0.09)); // stroke thickness
  const cr = hw * 0.28;       // corner radius of each arc

  // Top horizontal bar
  fillRect(m + cr, m, hw - cr * 2, T);
  // Top-left arc (top bar left cap going down)
  arc(m + cr, m + cr, cr, Math.PI, Math.PI * 1.5, 40, T);
  // Top-right arc (top bar right cap going down)
  arc(m + hw - cr, m + cr, cr, -Math.PI / 2, 0, 40, T);
  // Upper-right vertical going down to mid
  fillRect(m + hw - T, m + cr, T, mid - m - cr - T/2);
  // Middle bar
  fillRect(m + cr, mid - T/2, hw - cr, T);
  // Mid-right arc (middle right going down)
  arc(m + cr, mid + cr, cr, -Math.PI / 2, 0, 40, T);
  // Lower-left vertical going down from mid
  fillRect(m, mid + cr, T, s - m - cr - mid - cr);
  // Bottom-left arc
  arc(m + cr, s - m - cr, cr, Math.PI, Math.PI * 1.5, 40, T);
  // Bottom horizontal bar
  fillRect(m + cr, s - m - T, hw - cr * 2, T);
  // Bottom-right arc
  arc(m + hw - cr, s - m - cr, cr, 0, Math.PI / 2, 40, T);

  // Encode as PNG
  // Filter type 0 (None) for each row
  const rawRows = [];
  for (let y = 0; y < h; y++) {
    rawRows.push(0); // filter byte
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      rawRows.push(buf[i], buf[i+1], buf[i+2], buf[i+3]);
    }
  }
  const raw = Buffer.from(rawRows);
  const compressed = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcBuf = Buffer.concat([typeB, data]);
    const crc = crc32(crcBuf);
    const crcOut = Buffer.alloc(4); crcOut.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, typeB, data, crcOut]);
  }

  function crc32(buf) {
    const table = crc32.table || (crc32.table = (() => {
      const t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
      }
      return t;
    })());
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB... wait, we need RGBA → color type 6
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
  console.log('Created', filePath, `(${size}x${size})`);
}

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
writePNG(path.join(dir, 'icon-192.png'), 192);
writePNG(path.join(dir, 'icon-512.png'), 512);
console.log('Done. Icons saved to icons/');
