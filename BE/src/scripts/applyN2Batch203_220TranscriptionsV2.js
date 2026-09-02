const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
const root = path.resolve(__dirname, '../../..');
const currentFile = path.join(root, 'BE', 'file', 'n2_vocabulary.json');
const checkpointFile = path.join(root, 'BE', 'file', 'n2_vocabulary.ocr-checkpoint.json');
execFileSync(process.execPath, [path.join(root, 'tmp', 'fixBatchPages203_220.js')], { stdio: 'inherit' });
const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'));
const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
const wanted = new Set([731, 733, 740, 752, 772, 773, 775, 777, 781]);
const words = (book) => book.units.flatMap((u) => (u.parts || []).flatMap((p) => p.words || []));
const byNumber = new Map(words(checkpoint).map((w) => [w.sourceNumber, w]));
for (const word of words(current)) {
  if (!wanted.has(word.sourceNumber)) continue;
  const source = byNumber.get(word.sourceNumber);
  if (source) { word.meaning = source.meaning; word.examples = source.examples; }
}
current.verification.candidateHash = computeCandidateHash(current);
fs.writeFileSync(currentFile, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
console.log(`applied ${wanted.size} manually transcribed entries from pages 203–220`);
