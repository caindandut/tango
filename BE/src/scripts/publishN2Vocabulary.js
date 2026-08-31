/* eslint-disable no-console */
const fs = require('node:fs/promises');
const path = require('node:path');
const { validateN2Vocabulary } = require('../vocabulary/validateN2Vocabulary');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_CANDIDATE_PATH = path.join(
  ROOT_DIR,
  'tmp',
  'n2-manual-review',
  'n2_vocabulary.candidate.json',
);
const DEFAULT_OUTPUT_PATH = path.join(ROOT_DIR, 'BE', 'file', 'n2_vocabulary.json');

async function publishN2Vocabulary({
  candidatePath = DEFAULT_CANDIDATE_PATH,
  outputPath = DEFAULT_OUTPUT_PATH,
} = {}) {
  let candidate;
  try {
    candidate = JSON.parse(await fs.readFile(candidatePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Thiếu candidate N2 tại ${candidatePath}; hãy hoàn tất n2_vocabulary.manual.json rồi chạy n2:verify.`);
    }
    throw error;
  }
  validateN2Vocabulary(candidate, { requireVerified: true });
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
  await fs.copyFile(temporaryPath, outputPath);
  await fs.unlink(temporaryPath);
  console.log(`Đã publish dữ liệu N2 đã kiểm định tới ${outputPath}.`);
  return outputPath;
}

module.exports = publishN2Vocabulary;

if (require.main === module) {
  publishN2Vocabulary().catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}
