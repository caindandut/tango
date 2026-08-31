/* eslint-disable no-console */
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { N2_PARTS, N2_UNITS, TOTAL_N2_WORDS } = require('../vocabulary/n2Manifest');
const {
  computeCandidateHash,
  validateN2Vocabulary,
} = require('../vocabulary/validateN2Vocabulary');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_PDF_PATH = path.join('file', 'minikara n2 bản dịch tiếng việt.pdf');
const MANUAL_DIR = path.join(ROOT_DIR, 'tmp', 'n2-manual-review');
const MANUAL_SOURCE = path.join(ROOT_DIR, 'BE', 'file', 'n2_vocabulary.manual.json');
const MANUAL_CANDIDATE = path.join(MANUAL_DIR, 'n2_vocabulary.candidate.json');
const MANUAL_TEMPLATE = path.join(ROOT_DIR, 'BE', 'file', 'n2_vocabulary.manual.template.json');
const POPPLER_DIR = process.env.POPPLER_BIN
  || 'C:\\Users\\Lenovo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\native\\poppler\\Library\\bin';

function parseArguments(argv) {
  const args = {};
  const positionals = [];
  argv.forEach((entry) => {
    if (!entry.startsWith('--')) {
      positionals.push(entry);
      return;
    }
    const normalized = entry.replace(/^--/u, '');
    const separator = normalized.indexOf('=');
    args[separator < 0 ? normalized : normalized.slice(0, separator)] = separator < 0
      ? true
      : normalized.slice(separator + 1);
  });
  const mode = args.mode || 'export';
  if (!['export', 'template', 'verify'].includes(mode)) throw new Error('--mode must be template, export or verify');
  const pdfPath = args.pdf || positionals.find((entry) => path.extname(entry).toLowerCase() === '.pdf') || DEFAULT_PDF_PATH;
  if (path.extname(pdfPath).toLowerCase() !== '.pdf' || /^https?:/iu.test(pdfPath)) {
    throw new Error('--pdf must be a local PDF path');
  }
  return { mode, pdfPath, resume: args.resume === true || args.resume === 'true' };
}

async function createManualTemplate(pdfPath, sourceSha256) {
  const template = {
    schemaVersion: 1,
    level: 'N2',
    source: { fileName: path.basename(pdfPath), sha256: sourceSha256, pageCount: 361 },
    units: N2_UNITS.map((unit) => ({
      ...unit,
      parts: N2_PARTS.filter((part) => part.unitNumber === unit.unitNumber).map((part) => ({
        ...part,
        words: [],
      })),
    })),
    _instructions: 'Điền thủ công đủ words theo từng ảnh page-XXX.png; giữ nguyên nghĩa, ví dụ, quan hệ, furigana và gạch chân. Xóa trường _instructions trước khi verify.',
  };
  await fs.writeFile(MANUAL_TEMPLATE, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  console.log(`Đã tạo khung nhập liệu thủ công tại ${MANUAL_TEMPLATE}.`);
}

async function sha256File(filePath) {
  const bytes = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr}`));
    });
  });
}

async function exportManualPages(pdfPath, sourceSha256) {
  const pagesDir = path.join(MANUAL_DIR, 'pages');
  await fs.mkdir(pagesDir, { recursive: true });
  const pageFiles = await fs.readdir(pagesDir).catch(() => []);
  const expectedPageFiles = new Set(Array.from({ length: 361 }, (_, index) => `page-${String(index + 1).padStart(3, '0')}.png`));
  const renderedPageFiles = new Set(pageFiles.filter((file) => /^page-\d{3}\.png$/u.test(file)));
  const hasCompletePageSet = renderedPageFiles.size === expectedPageFiles.size
    && [...expectedPageFiles].every((file) => renderedPageFiles.has(file));
  // A complete page set is a reusable manual checkpoint. Delete it explicitly
  // when a fresh render is required; this also keeps npm's Windows argument
  // forwarding from accidentally causing a 361-page re-render.
  if (!hasCompletePageSet) {
    const pdftoppm = path.join(POPPLER_DIR, process.platform === 'win32' ? 'pdftoppm.exe' : 'pdftoppm');
    await runCommand(pdftoppm, ['-png', '-r', '120', '-f', '1', '-l', '361', pdfPath, path.join(pagesDir, 'page')]);
  }

  const manifest = {
    schemaVersion: 1,
    mode: 'manual-only',
    source: { fileName: path.basename(pdfPath), sha256: sourceSha256, pageCount: 361 },
    renderDpi: 120,
    pagesDir,
    instructions: 'Mở từng page-XXX.png, chép đúng vùng từ vựng và bỏ qua 練習問題/audio. Ghi pdfPage, printedPage, segments, reading và gạch chân theo ảnh.',
    units: N2_UNITS,
    parts: N2_PARTS,
    totalWords: TOTAL_N2_WORDS,
  };
  await fs.writeFile(path.join(MANUAL_DIR, 'manual-review-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Đã xuất 361 ảnh PDF vào ${pagesDir}.`);
  console.log(`Tạo dữ liệu thủ công tại ${MANUAL_SOURCE} rồi chạy npm run n2:verify.`);
}

async function verifyManualCandidate(pdfPath, sourceSha256) {
  let candidate;
  try {
    candidate = JSON.parse(await fs.readFile(MANUAL_SOURCE, 'utf8'));
  } catch {
    throw new Error(`Thiếu ${MANUAL_SOURCE}; hãy chép thủ công đủ ${TOTAL_N2_WORDS} từ theo ảnh.`);
  }
  if (candidate.source?.sha256 !== sourceSha256) throw new Error('Bản thủ công không khớp SHA-256 PDF nguồn.');
  validateN2Vocabulary(candidate, { requireVerified: false });
  if (candidate.units.flatMap((unit) => unit.parts.flatMap((part) => part.words)).length !== TOTAL_N2_WORDS) {
    throw new Error(`Bản thủ công phải đủ ${TOTAL_N2_WORDS} từ liên tục.`);
  }
  candidate.verification = {
    approved: true,
    method: 'manual-page-by-page',
    issues: [],
    candidateHash: '',
  };
  candidate.verification.candidateHash = computeCandidateHash(candidate);
  validateN2Vocabulary(candidate, { requireVerified: true });
  await fs.mkdir(MANUAL_DIR, { recursive: true });
  await fs.writeFile(MANUAL_CANDIDATE, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
  console.log(`Đã xác nhận thủ công đủ ${TOTAL_N2_WORDS} từ; candidate sẵn sàng publish.`);
}

async function main(options = parseArguments(process.argv.slice(2))) {
  const absolutePdfPath = path.resolve(process.cwd(), options.pdfPath);
  await fs.access(absolutePdfPath);
  const sourceSha256 = await sha256File(absolutePdfPath);
  if (options.mode === 'export') {
    await exportManualPages(absolutePdfPath, sourceSha256, options);
  } else if (options.mode === 'template') {
    await createManualTemplate(absolutePdfPath, sourceSha256);
  } else {
    await verifyManualCandidate(absolutePdfPath, sourceSha256);
  }
}

module.exports = {
  MANUAL_CANDIDATE,
  MANUAL_DIR,
  MANUAL_SOURCE,
  MANUAL_TEMPLATE,
  createManualTemplate,
  exportManualPages,
  main,
  parseArguments,
  verifyManualCandidate,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}
