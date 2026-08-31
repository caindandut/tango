const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');
const { validateN2Vocabulary } = require('../vocabulary/validateN2Vocabulary');

const DEFAULT_DATA_PATH = path.join(__dirname, '../../file/n2_vocabulary.json');
// Prisma interactive transactions default to 5 seconds. A first deploy has
// to upsert 22 sets and persist 1,160 JSON vocabulary records, so the default
// is too short on Render's cold database connections.
const DEFAULT_TRANSACTION_TIMEOUT_MS = 120000;
const DEFAULT_TRANSACTION_MAX_WAIT_MS = 30000;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function setName(unit, part) {
  const unitLabel = `Unit ${String(unit.unitNumber).padStart(2, '0')} - ${unit.titleJa}`;
  return `${unitLabel} - ${part.title} - Từ vựng N2 Mimikara`;
}

function wordData(word, position) {
  return {
    position,
    sourceNumber: word.sourceNumber,
    kanji: word.kanji,
    hiragana: word.hiragana,
    meaning: word.meaning,
    hanVietMeaning: word.hanVietMeaning,
    examples: word.examples,
    relations: word.relations,
  };
}

async function syncPart(tx, unit, part) {
  const metadata = {
    code: part.code,
    name: setName(unit, part),
    level: 'N2',
    unitNumber: unit.unitNumber,
    unitTitle: unit.titleJa,
    partNumber: part.partNumber,
    partTitle: part.title,
    rangeStart: part.rangeStart,
    rangeEnd: part.rangeEnd,
    isSummary: part.isSummary,
    totalWords: part.words.length,
  };
  const set = await tx.vocabularySet.upsert({
    where: { code: part.code },
    create: metadata,
    update: metadata,
  });
  const existingWords = await tx.vocabulary.findMany({
    where: { setId: set.id },
    select: { id: true, position: true },
    orderBy: { position: 'asc' },
  });
  const words = part.words.map((word, index) => wordData(word, index + 1));

  if (existingWords.length === 0) {
    await tx.vocabulary.createMany({
      data: words.map((word) => ({ ...word, setId: set.id })),
    });
    return;
  }
  if (existingWords.length !== words.length
    || existingWords.some((word, index) => word.position !== index + 1)) {
    throw new Error(`${part.code} có số từ hiện hữu không khớp; seed dừng để bảo toàn kết quả học.`);
  }
  for (const [index, word] of words.entries()) {
    await tx.vocabulary.update({
      where: { id: existingWords[index].id },
      data: word,
    });
  }
}

async function seedN2FromJson({
  client = prisma,
  data,
  validator = validateN2Vocabulary,
} = {}) {
  const candidate = data || JSON.parse(fs.readFileSync(DEFAULT_DATA_PATH, 'utf8'));
  const validated = validator(candidate, { requireVerified: true });
  const transactionOptions = {
    maxWait: positiveInteger(
      process.env.N2_SEED_TRANSACTION_MAX_WAIT_MS,
      DEFAULT_TRANSACTION_MAX_WAIT_MS,
    ),
    timeout: positiveInteger(
      process.env.N2_SEED_TRANSACTION_TIMEOUT_MS,
      DEFAULT_TRANSACTION_TIMEOUT_MS,
    ),
  };
  await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tango-n2-vocabulary-seed'))`;
    for (const unit of validated.units) {
      for (const part of unit.parts) await syncPart(tx, unit, part);
    }
  }, transactionOptions);
  console.log('✅ Successfully synced N2 Mimikara vocabulary without resetting N3 data');
  return true;
}

module.exports = seedN2FromJson;
module.exports.setName = setName;
module.exports.syncPart = syncPart;
module.exports.wordData = wordData;
module.exports.positiveInteger = positiveInteger;

if (require.main === module) {
  seedN2FromJson()
    .catch((error) => {
      console.error('N2 seed error:', error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
