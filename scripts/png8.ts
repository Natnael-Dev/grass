import zlib from 'node:zlib';

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    const tableVal = crcTable[(c ^ byte) & 0xff] ?? 0;
    c = (c >>> 8) ^ tableVal;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const toCrc = Buffer.concat([typeBuf, data]);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

export function encodePng8(width: number, height: number, rgbaBuffer: Buffer | Uint8Array): Buffer {
  // 5x6x5 color cube = 150 colors
  const palette = Buffer.alloc(256 * 3);
  let pIdx = 0;
  for (let r = 0; r < 5; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 5; b++) {
        palette[pIdx * 3] = Math.round((r / 4) * 255);
        palette[pIdx * 3 + 1] = Math.round((g / 5) * 255);
        palette[pIdx * 3 + 2] = Math.round((b / 4) * 255);
        pIdx++;
      }
    }
  }

  const scanlineWidth = width + 1;
  const rawData = Buffer.alloc(scanlineWidth * height);

  for (let y = 0; y < height; y++) {
    const rawLineOffset = y * scanlineWidth;
    rawData[rawLineOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const srcOffset = (y * width + x) * 4;
      const r = rgbaBuffer[srcOffset] ?? 0;
      const g = rgbaBuffer[srcOffset + 1] ?? 0;
      const b = rgbaBuffer[srcOffset + 2] ?? 0;

      const rIdx = Math.min(4, Math.floor((r / 256) * 5));
      const gIdx = Math.min(5, Math.floor((g / 256) * 6));
      const bIdx = Math.min(4, Math.floor((b / 256) * 5));
      const colorIdx = rIdx * 30 + gIdx * 5 + bIdx;

      rawData[rawLineOffset + 1 + x] = colorIdx;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per pixel
  ihdrData[9] = 3; // Indexed color (palette)
  ihdrData[10] = 0; // Deflate compression
  ihdrData[11] = 0; // Filter 0
  ihdrData[12] = 0; // No interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const plteChunk = makeChunk('PLTE', palette);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, plteChunk, idatChunk, iendChunk]);
}
