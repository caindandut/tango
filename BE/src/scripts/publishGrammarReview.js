/* eslint-disable no-console */
require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');

const { validateGrammarCurriculum } = require('../grammar/validateGrammarCurriculum');
const { validateGrammarContent } = require('../grammar/validateGrammarContent');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const REVIEW_DIR = path.join(ROOT_DIR, 'tmp', 'grammar-review');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'grammar', 'curriculum.json');

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function publish() {
  const candidatePath = path.join(REVIEW_DIR, 'curriculum.candidate.json');
  const candidate = await readJson(candidatePath);
  validateGrammarCurriculum(candidate);
  validateGrammarContent(candidate);

  for (const week of candidate.weeks) {
    for (const day of week.days) {
      const verification = await readJson(path.join(REVIEW_DIR, `${day.id}.verification.json`));
      if (verification.approved !== true) {
        throw new Error(`Verifier chưa duyệt ${day.id}.`);
      }
      if ((verification.issues || []).some((issue) => issue?.severity === 'blocking')) {
        throw new Error(`Verifier còn blocking issue ở ${day.id}.`);
      }
    }
  }

  await fs.mkdir(path.join(REVIEW_DIR, 'backup'), { recursive: true });
  await fs.copyFile(OUTPUT_PATH, path.join(REVIEW_DIR, 'backup', 'curriculum.before-review.json'));
  const temporaryPath = `${OUTPUT_PATH}.reviewed.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, OUTPUT_PATH);
  console.log(`Đã publish curriculum đã kiểm chứng vào ${path.relative(ROOT_DIR, OUTPUT_PATH)}.`);
}

if (require.main === module) {
  publish().catch((error) => {
    console.error(error?.message || error);
    process.exitCode = 1;
  });
}

module.exports = { publish };
