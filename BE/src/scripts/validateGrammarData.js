const curriculum = require('../data/grammar/curriculum.json');
const { validateGrammarCurriculum } = require('../grammar/validateGrammarCurriculum');
const { validateGrammarContent } = require('../grammar/validateGrammarContent');

validateGrammarCurriculum(curriculum);
validateGrammarContent(curriculum);
const questionCount = curriculum.weeks.flatMap((week) => week.days)
  .flatMap((day) => day.questions || []).length;
console.log(`Grammar curriculum hợp lệ về cấu trúc và nội dung: 6 tuần × 7 ngày, ${questionCount} câu theo PDF.`);
