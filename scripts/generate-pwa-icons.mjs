import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outputDir = path.join(process.cwd(), "public");
const background = [17, 19, 24, 255];
const white = [255, 255, 255, 255];
const violet = [109, 40, 217, 255];
const cyan = [53, 200, 232, 255];

const polygons = [
  { points: [[110,360],[218,130],[290,130],[402,360],[324,360],[301,308],[207,308],[184,360]], color: white },
  { points: [[225,250],[250,192],[275,250]], color: violet },
  { points: [[340,62],[348,102],[388,92],[360,123],[388,150],[346,143],[333,182],[325,141],[284,148],[312,120],[285,90],[327,102]], color: cyan },
];

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function makePng(size) {
  const rows = [];
  const scale = size / 512;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5) / scale;
      const py = (y + 0.5) / scale;
      let color = background;
      for (const polygon of polygons) if (insidePolygon(px, py, polygon.points)) color = polygon.color;
      if (py >= 397 && py <= 413 && px >= 80 && px <= 432) color = cyan;
      const offset = 1 + x * 4;
      row[offset] = color[0]; row[offset + 1] = color[1];
      row[offset + 2] = color[2]; row[offset + 3] = color[3];
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA
  const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 9 });
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(outputDir, { recursive: true });
for (const size of [180, 192, 512]) {
  const file = path.join(outputDir, `africhiko-icon-${size}.png`);
  fs.writeFileSync(file, makePng(size));
  console.log(`Generated ${path.relative(process.cwd(), file)} (${size}×${size} PNG)`);
}
