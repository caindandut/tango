const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const prisma = require('../lib/prisma');
const validateN3Vocabulary = require('./validateN3Vocabulary');

async function seedN3FromJson({ client = prisma, force = false } = {}) {
  const jsonPath = path.join(__dirname, '../../file/n3_vocabulary.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, ''));
  const lessons = validateN3Vocabulary(data);

  const seeded = await client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('tango-n3-vocabulary-seed'))`;
    const existingSets = await tx.vocabularySet.count();
    if (!force && existingSets > 0) return false;

    await tx.vocabularySet.deleteMany({});
    for (const [name, words] of lessons) {
      await tx.vocabularySet.create({
        data: {
          name: `${name} - Từ vựng N3 Mimikara`,
          totalWords: words.length,
          vocabularies: {
            create: words.map(({ kanji, hiragana, meaning, examples = [] }, index) => ({
              position: index + 1,
              kanji,
              hiragana,
              meaning,
              examples,
            })),
          },
        },
      });
    }
    return true;
  });
  console.log(seeded
    ? '✅ Successfully seeded N3 Mimikara vocabulary from JSON file'
    : 'ℹ️ N3 vocabulary already exists; skipped startup reset');
  return seeded;
}

module.exports = seedN3FromJson;

if (require.main === module) {
  seedN3FromJson({ force: true })
    .catch((error) => {
      console.error('Seed script error:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
