const curriculum = require('../data/grammar/curriculum.json');
const { validateGrammarCurriculum } = require('../grammar/validateGrammarCurriculum');

validateGrammarCurriculum(curriculum);
console.log('Grammar curriculum hợp lệ: 6 tuần × 7 ngày, 402 câu.');
