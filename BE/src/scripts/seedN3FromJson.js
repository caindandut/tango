const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const prisma = require('../lib/prisma');

const jsonPath = path.join(__dirname, '../../file/n3_vocabulary.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, ''));
const lessons = Object.entries(data);
const expected = [120, 100, 78, 112, 100, 40, 40, 45, 80, 80, 50, 35];

if (lessons.length !== 12 || lessons.some(([, words], i) => words.length !== expected[i])) {
  throw new Error('n3_vocabulary.json must contain 12 lessons with exactly 880 words');
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.vocabularySet.deleteMany({ where: { name: { contains: 'N3 Mimikara' } } });
    for (const [name, words] of lessons) {
      await tx.vocabularySet.create({
        data: {
          name: `${name} - Từ vựng N3 Mimikara`,
          totalWords: words.length,
          vocabularies: {
            create: words.map(({ kanji, hiragana, meaning }, index) => ({
              position: index + 1,
              kanji,
              hiragana,
              meaning,
            })),
          },
        },
      });
    }
  });
  console.log(JSON.stringify({ seeded: true, lessons: lessons.length, totalWords: expected.reduce((a, b) => a + b, 0) }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
