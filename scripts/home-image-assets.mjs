import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const HOME_IMAGE_SOURCE = path.join('assets', 'data', 'home');
const HOME_IMAGE_OUTPUT = path.join('assets', 'images', 'home');

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function getWebpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Decoded homepage image is not a valid WebP file.');
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const fourCC = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;

    if (fourCC === 'VP8X' && dataOffset + 10 <= buffer.length) {
      return {
        width: readUInt24LE(buffer, dataOffset + 4) + 1,
        height: readUInt24LE(buffer, dataOffset + 7) + 1,
      };
    }

    if (fourCC === 'VP8L' && dataOffset + 5 <= buffer.length && buffer[dataOffset] === 0x2f) {
      const b1 = buffer[dataOffset + 1];
      const b2 = buffer[dataOffset + 2];
      const b3 = buffer[dataOffset + 3];
      const b4 = buffer[dataOffset + 4];
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
      };
    }

    if (
      fourCC === 'VP8 ' &&
      dataOffset + 10 <= buffer.length &&
      buffer[dataOffset + 3] === 0x9d &&
      buffer[dataOffset + 4] === 0x01 &&
      buffer[dataOffset + 5] === 0x2a
    ) {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  throw new Error('Unable to read homepage WebP dimensions.');
}

async function decodeChunkedImage({ outputDirectory, name, parts, filename, minimumWidth, minimumHeight }) {
  const sourceDirectory = path.join(outputDirectory, HOME_IMAGE_SOURCE);
  const chunks = [];

  for (let index = 1; index <= parts; index += 1) {
    const chunkPath = path.join(sourceDirectory, `${name}-${String(index).padStart(2, '0')}.txt`);
    chunks.push((await readFile(chunkPath, 'utf8')).replace(/\s+/g, ''));
  }

  const bytes = Buffer.from(chunks.join(''), 'base64');
  if (bytes.length < 16000) throw new Error(`${filename} is unexpectedly small or incomplete (${bytes.length} bytes).`);

  const dimensions = getWebpDimensions(bytes);
  if (dimensions.width < minimumWidth || dimensions.height < minimumHeight) {
    throw new Error(`${filename} is not HD enough (${dimensions.width}x${dimensions.height}).`);
  }

  const destinationDirectory = path.join(outputDirectory, HOME_IMAGE_OUTPUT);
  await mkdir(destinationDirectory, { recursive: true });
  const destination = path.join(destinationDirectory, filename);
  await writeFile(destination, bytes);

  return { filename, bytes: bytes.length, ...dimensions };
}

export async function materializeHomeImages({ outputDirectory }) {
  const hero = await decodeChunkedImage({
    outputDirectory,
    name: 'hero',
    parts: 4,
    filename: 'francine-home-hero-hd.webp',
    minimumWidth: 1400,
    minimumHeight: 800,
  });

  const founder = await decodeChunkedImage({
    outputDirectory,
    name: 'founder',
    parts: 5,
    filename: 'francine-home-founder-hd.webp',
    minimumWidth: 1400,
    minimumHeight: 800,
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    hero,
    founder,
  };
  await writeFile(
    path.join(outputDirectory, HOME_IMAGE_OUTPUT, 'home-image-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`Homepage HD images ready: hero ${hero.width}x${hero.height}, founder ${founder.width}x${founder.height}.`);
  return { hero, founder };
}
