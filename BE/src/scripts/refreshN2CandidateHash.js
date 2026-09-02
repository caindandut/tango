const fs = require('fs');
const path = require('path');
const { computeCandidateHash } = require('../vocabulary/validateN2Vocabulary');
const file = path.resolve(__dirname, '../../file/n2_vocabulary.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.verification.candidateHash = computeCandidateHash(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(data.verification.candidateHash);
