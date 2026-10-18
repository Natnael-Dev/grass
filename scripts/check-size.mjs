import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST_DIR = path.resolve('dist/assets');
const MAX_JS_GZIP_BYTES = 300 * 1024; // 300 KB
const MAX_TOTAL_GZIP_BYTES = 500 * 1024; // 500 KB

if (!fs.existsSync(DIST_DIR)) {
  console.error(`Error: Assets directory not found at ${DIST_DIR}. Run build first.`);
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR);
let totalGzipBytes = 0;
let maxJsGzipBytes = 0;
let maxJsFileName = '';

console.log('Asset Gzip Size Check:');
console.log('--------------------------------------------------');

for (const file of files) {
  const filePath = path.join(DIST_DIR, file);
  const content = fs.readFileSync(filePath);
  const gzipped = zlib.gzipSync(content);
  const gzipSize = gzipped.length;
  totalGzipBytes += gzipSize;

  const sizeKb = (gzipSize / 1024).toFixed(2);
  const rawKb = (content.length / 1024).toFixed(2);
  console.log(`- ${file}: raw ${rawKb} KB -> gzip ${sizeKb} KB`);

  if (file.endsWith('.js') && gzipSize > maxJsGzipBytes) {
    maxJsGzipBytes = gzipSize;
    maxJsFileName = file;
  }
}

console.log('--------------------------------------------------');
console.log(`Total bundle gzip: ${(totalGzipBytes / 1024).toFixed(2)} KB (budget: 500 KB)`);
console.log(`Largest JS file (${maxJsFileName}): ${(maxJsGzipBytes / 1024).toFixed(2)} KB (budget: 300 KB)`);

let failed = false;
if (maxJsGzipBytes > MAX_JS_GZIP_BYTES) {
  console.error(
    `FAILED: Largest JS file exceeds 300 KB budget: ${(maxJsGzipBytes / 1024).toFixed(2)} KB > 300 KB`,
  );
  failed = true;
}

if (totalGzipBytes > MAX_TOTAL_GZIP_BYTES) {
  console.error(
    `FAILED: Total bundle exceeds 500 KB budget: ${(totalGzipBytes / 1024).toFixed(2)} KB > 500 KB`,
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('Size check PASSED.');
