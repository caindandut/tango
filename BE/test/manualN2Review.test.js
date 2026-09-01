const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {
  MANUAL_DIR,
  parseArguments,
} = require('../src/scripts/manualN2Review');
const { main: legacyGeminiMain } = require('../src/scripts/reviewN2Vocabulary');

test('manual N2 commands accept only local PDF and template/export/verify modes', () => {
  assert.deepEqual(
    parseArguments(['--mode=export', '--pdf=file/book.pdf', '--resume']),
    { mode: 'export', pdfPath: 'file/book.pdf', resume: true },
  );
  assert.deepEqual(
    parseArguments(['--mode=verify', '--pdf=file/book.pdf']),
    { mode: 'verify', pdfPath: 'file/book.pdf', resume: false },
  );
  assert.equal(parseArguments(['--mode=verify', 'file/book.pdf']).pdfPath, 'file/book.pdf');
  assert.equal(parseArguments(['--mode=template', '--pdf=file/book.pdf']).mode, 'template');
  assert.throws(() => parseArguments(['--mode=extract', '--pdf=file/book.pdf']), /template, export or verify/);
  assert.throws(() => parseArguments(['--mode=export', '--pdf=https:\/\/example.com/book.pdf']), /local PDF/);
});

test('manual review workspace is isolated from Gemini checkpoints', async () => {
  assert.match(MANUAL_DIR, /tmp[\\/]n2-manual-review/iu);
  assert.doesNotMatch(MANUAL_DIR, /n2-vocabulary-review/);
  await fs.mkdir(MANUAL_DIR, { recursive: true });
});

test('legacy Gemini N2 entrypoint is hard-disabled', async () => {
  await assert.rejects(
    () => legacyGeminiMain({ mode: 'extract', pdfPath: 'file/book.pdf', from: 1, to: 20 }),
    /Gemini.*vô hiệu hóa/iu,
  );
});
