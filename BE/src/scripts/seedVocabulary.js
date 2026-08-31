/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../lib/prisma');
const seedN3FromJson = require('./seedN3FromJson');
const seedN2FromJson = require('./seedN2FromJson');

const N2_DATA_PATH = path.join(__dirname, '../../file/n2_vocabulary.json');

async function seedVocabulary({ client = prisma } = {}) {
  await seedN3FromJson({ client });
  if (fs.existsSync(N2_DATA_PATH)) {
    await seedN2FromJson({ client });
  } else {
    console.log('ℹ️ Chưa có dữ liệu N2 đã publish; bỏ qua seed N2.');
  }
}

module.exports = seedVocabulary;

if (require.main === module) {
  seedVocabulary()
    .catch((error) => {
      console.error('Vocabulary seed error:', error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
