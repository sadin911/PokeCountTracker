import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read credentials from secret.yaml
const secretRaw = fs.readFileSync(path.join(__dirname, '../secret.yaml'), 'utf-8');
const accessKey = secretRaw.match(/AccessKey:\s*([^\r\n]+)/)?.[1]?.trim();
const secretKey = secretRaw.match(/Secret:\s*([^\r\n]+)/)?.[1]?.trim();
const endpoint = secretRaw.match(/S3Endpoint:\s*([^\r\n]+)/)?.[1]?.trim();
const BUCKET_NAME = 'pokecount-cards';

const s3 = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

const JSON_PATH = path.join(__dirname, '../src/data/pokemonNames.json');
const RAW_DIR = path.join(__dirname, '../data/pokemon-tcg-th/raw-images');
const HD_DIR = path.join(__dirname, '../public/card-images-hd');

const CONCURRENCY = 35;

if (!fs.existsSync(JSON_PATH)) {
  console.error('❌ Data file not found:', JSON_PATH);
  process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
console.log(`🔍 Total cards in dataset: ${cards.length}`);

fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(HD_DIR, { recursive: true });

const queue = [];
for (const card of cards) {
  if (!card.imageUrl && !card.officialImageUrl) continue;

  const cleanRelPath = decodeURIComponent(card.imageUrl || '')
    .replace(/^\/?PokeCountTracker/, '')
    .replace(/^\/+/, '');

  if (!cleanRelPath) continue;

  const subPathWithoutExt = cleanRelPath
    .replace(/^card-images\//, '')
    .replace(/\.(webp|png|jpg|jpeg)$/, '');

  const rawPath = path.join(RAW_DIR, `${subPathWithoutExt}.png`);
  const hdJpgPath = path.join(HD_DIR, `${subPathWithoutExt}.jpg`);
  const hdJpgR2Key = `card-images-hd/${subPathWithoutExt}.jpg`;
  const hdWebpR2Key = `card-images-hd/${subPathWithoutExt}.webp`;

  queue.push({
    card,
    subPathWithoutExt,
    rawPath,
    hdJpgPath,
    hdJpgR2Key,
    hdWebpR2Key,
    officialUrl: card.officialImageUrl || null,
  });
}

console.log(`📦 Cards to convert to JPG 70% & upload to R2: ${queue.length}`);

let completed = 0;
let skipped = 0;
let errors = 0;
const startTime = Date.now();

async function uploadBufferToR2(key, buffer, contentType = 'image/jpeg') {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  await s3.send(command);
}

async function processCard(item) {
  const { card, rawPath, hdJpgPath, hdJpgR2Key, hdWebpR2Key, officialUrl } = item;

  fs.mkdirSync(path.dirname(rawPath), { recursive: true });
  fs.mkdirSync(path.dirname(hdJpgPath), { recursive: true });

  let rawBuf = null;

  // 1. Get raw original buffer (Preserve local disk original)
  if (fs.existsSync(rawPath) && fs.statSync(rawPath).size > 100) {
    rawBuf = fs.readFileSync(rawPath);
  } else if (officialUrl) {
    try {
      const res = await fetch(officialUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Referer': 'https://asia.pokemon-card.com/th/card-search/',
        },
      });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 100) {
          rawBuf = buf;
          fs.writeFileSync(rawPath, rawBuf);
        }
      }
    } catch (e) {}
  }

  // Fallback: Check local thumb or HD if raw is somehow unavailable
  if (!rawBuf) {
    const thumbFallback = path.join(__dirname, '../public/card-images', `${item.subPathWithoutExt}.webp`);
    if (fs.existsSync(thumbFallback) && fs.statSync(thumbFallback).size > 100) {
      rawBuf = fs.readFileSync(thumbFallback);
    }
  }

  if (!rawBuf) {
    return false;
  }

  // 2. Full native raw resolution converted directly to JPEG 70% with mozjpeg
  let jpgBuf = null;
  try {
    jpgBuf = await sharp(rawBuf)
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(hdJpgPath, jpgBuf);
  } catch (err) {
    console.error(`❌ Sharp error for ${card.name}:`, err.message);
    return false;
  }

  // 3. Upload to Cloudflare R2 (both .jpg and .webp keys for complete compatibility)
  try {
    await Promise.all([
      uploadBufferToR2(hdJpgR2Key, jpgBuf, 'image/jpeg'),
      uploadBufferToR2(hdWebpR2Key, jpgBuf, 'image/jpeg'),
    ]);
    return true;
  } catch (err) {
    console.error(`❌ R2 upload error for ${card.name}:`, err.message);
    return false;
  }
}

async function worker() {
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;

    const ok = await processCard(item);
    if (ok) {
      completed++;
    } else {
      errors++;
    }

    const totalDone = completed + skipped + errors;
    if (totalDone % 250 === 0 || queue.length === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (totalDone / (elapsed || 1)).toFixed(1);
      console.log(
        `⚡ [${totalDone}/${cards.length}] Completed: ${completed}, Errors: ${errors} | Speed: ${rate} cards/s | Elapsed: ${elapsed}s`
      );
    }
  }
}

console.log(`🚀 Starting JPG 70% HD Conversion & R2 Upload with ${CONCURRENCY} parallel workers...`);
const workers = Array.from({ length: CONCURRENCY }, () => worker());
await Promise.all(workers);

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n🎉 All Done!`);
console.log(`✅ Completed: ${completed}`);
console.log(`❌ Errors: ${errors}`);
console.log(`⏱️ Total time: ${totalTime}s`);
