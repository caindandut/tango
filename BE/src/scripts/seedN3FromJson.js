const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const prisma = require('../lib/prisma');
const validateN3Vocabulary = require('./validateN3Vocabulary');

function n3SetMetadata(lessonName, words, lessonIndex) {
  return {
    code: `N3-L${String(lessonIndex + 1).padStart(2, '0')}`,
    name: `${lessonName} - Từ vựng N3 Mimikara`,
    level: 'N3',
    unitNumber: lessonIndex + 1,
    unitTitle: lessonName,
    partNumber: 1,
    partTitle: lessonName,
    rangeStart: 1,
    rangeEnd: words.length,
    isSummary: false,
    totalWords: words.length,
  };
}

function n3WordData(word, index) {
  return {
    position: index + 1,
    sourceNumber: index + 1,
    kanji: word.kanji,
    hiragana: word.hiragana,
    meaning: word.meaning,
    hanVietMeaning: word.hanVietMeaning,
    examples: word.examples || [],
    relations: [],
  };
}

async function syncExistingN3Vocabulary(tx, lessons) {
  const expectedSets = lessons.map(([name]) => `${name} - Từ vựng N3 Mimikara`);
  const existingSets = await tx.vocabularySet.findMany({
    where: { name: { in: expectedSets } },
    include: {
      vocabularies: {
        select: { id: true, position: true, hanVietMeaning: true },
        orderBy: { position: 'asc' },
      },
    },
  });

  const setsByName = new Map(existingSets.map((set) => [set.name, set]));

  let updated = false;
  for (const [lessonIndex, [lessonName, words]] of lessons.entries()) {
    const metadata = n3SetMetadata(lessonName, words, lessonIndex);
    const set = setsByName.get(`${lessonName} - Từ vựng N3 Mimikara`);
    if (!set) {
      const createdSet = await tx.vocabularySet.create({ data: metadata });
      await tx.vocabulary.createMany({
        data: words.map((word, index) => ({
          ...n3WordData(word, index),
          setId: createdSet.id,
        })),
      });
      updated = true;
      continue;
    }
    if (set.vocabularies.length !== words.length
      || set.vocabularies.some((vocabulary, index) => vocabulary.position !== index + 1)) {
      throw new Error(`${metadata.code} có số từ hiện hữu không khớp; seed dừng để bảo toàn kết quả học.`);
    }
    await tx.vocabularySet.update({
      where: { id: set.id },
      data: metadata,
    });
    for (const [index, word] of words.entries()) {
      const vocabulary = set.vocabularies[index];
      if (vocabulary.hanVietMeaning === word.hanVietMeaning) continue;
      await tx.vocabulary.update({
        where: { id: vocabulary.id },
        data: { hanVietMeaning: word.hanVietMeaning },
      });
      updated = true;
    }
  }
  return updated;
}

async function seedN3FromJson({ client = prisma, force = false } = {}) {
  const jsonPath = path.join(__dirname, '../../file/n3_vocabulary.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, ''));
  const lessons = validateN3Vocabulary(data);

  const seeded = await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tango-n3-vocabulary-seed'))`;
    return syncExistingN3Vocabulary(tx, lessons);
  });
  console.log(seeded
    ? '✅ Successfully seeded N3 Mimikara vocabulary from JSON file'
    : 'ℹ️ N3 vocabulary already exists; skipped startup reset');
  return seeded;
}

module.exports = seedN3FromJson;
module.exports.syncExistingN3Vocabulary = syncExistingN3Vocabulary;

if (require.main === module) {
  seedN3FromJson()
    .catch((error) => {
      console.error('Seed script error:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
