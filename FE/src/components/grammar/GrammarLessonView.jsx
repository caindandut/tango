import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, RotateCcw } from 'lucide-react';
import GrammarQuestion from './GrammarQuestion';
import GrammarStructures from './GrammarStructures';
import GrammarTitle from './GrammarTitle';
import TextSegments from './TextSegments';
import { grammarApi } from '@/lib/api';
import { getDayProgress, updateGrammarDay } from '@/lib/grammarProgress';

function formatParaphraseJa(paraphraseJa) {
  const normalized = paraphraseJa.trimStart();
  return normalized.startsWith('(=')
    ? normalized.replace(/^\(=\s*/, '(')
    : normalized.replace(/^=\s*/, '');
}

export default function GrammarLessonView({ day }) {
  const stored = getDayProgress(day.id);
  const lastGrammarPointIndex = Math.max(0, day.grammarPoints.length - 1);
  const [grammarPointIndex, setGrammarPointIndex] = useState(() => Math.min(stored.grammarPointIndex || 0, lastGrammarPointIndex));
  const [grammarCompleted, setGrammarCompleted] = useState(() => (
    day.grammarPoints.length <= 1 || Boolean(stored.grammarCompleted || stored.grammarPointIndex >= lastGrammarPointIndex)
  ));
  const [showTranslations, setShowTranslations] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(Number.isInteger(stored.currentQuestionIndex));
  const [questionIndex, setQuestionIndex] = useState(stored.currentQuestionIndex || 0);
  const [selected, setSelected] = useState(stored.dailyAnswers || {});
  const [results, setResults] = useState(stored.dailyResults || {});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const question = day.questions[questionIndex];
  const point = day.grammarPoints[grammarPointIndex];
  const result = question ? results[question.id] : null;
  const answeredCount = Object.keys(results).length;

  useEffect(() => {
    if (!question && day.questions.length) setQuestionIndex(0);
  }, [day.questions.length, question]);

  useEffect(() => {
    const progress = getDayProgress(day.id);
    const nextIndex = Math.min(progress.grammarPointIndex || 0, lastGrammarPointIndex);
    setGrammarPointIndex(nextIndex);
    setGrammarCompleted(day.grammarPoints.length <= 1 || Boolean(progress.grammarCompleted || nextIndex >= lastGrammarPointIndex));
  }, [day.id, day.grammarPoints.length, lastGrammarPointIndex]);

  const currentAnswer = question ? selected[question.id] : undefined;
  const canCheck = Boolean(currentAnswer) && !result && !checking;

  async function checkAnswer() {
    if (!question || !canCheck) return;
    setChecking(true);
    setError('');
    try {
      const { data } = await grammarApi.checkQuestion(day.weekNumber, day.dayNumber, question.id, currentAnswer);
      const nextResults = { ...results, [question.id]: data };
      setResults(nextResults);
      updateGrammarDay(day.id, (previous) => ({
        ...previous,
        currentQuestionIndex: questionIndex,
        dailyAnswers: { ...(previous.dailyAnswers || {}), [question.id]: currentAnswer },
        dailyResults: nextResults,
      }));
    } catch {
      setError('Không thể chấm câu này. Hãy thử lại.');
    } finally {
      setChecking(false);
    }
  }

  function chooseAnswer(optionId) {
    if (result) return;
    const nextAnswers = { ...selected, [question.id]: optionId };
    setSelected(nextAnswers);
    updateGrammarDay(day.id, (previous) => ({ ...previous, dailyAnswers: nextAnswers }));
  }

  function startExercise() {
    setExerciseStarted(true);
    setQuestionIndex(0);
    updateGrammarDay(day.id, (previous) => ({ ...previous, currentQuestionIndex: 0 }));
  }

  function goToGrammarPoint(nextIndex) {
    const safeIndex = Math.max(0, Math.min(nextIndex, lastGrammarPointIndex));
    const reachedLastPoint = safeIndex >= lastGrammarPointIndex;
    const nextCompleted = grammarCompleted || reachedLastPoint;
    setGrammarPointIndex(safeIndex);
    setGrammarCompleted(nextCompleted);
    updateGrammarDay(day.id, (previous) => ({
      ...previous,
      grammarPointIndex: safeIndex,
      grammarCompleted: nextCompleted,
    }));
  }

  function nextQuestion() {
    if (!result) return;
    if (questionIndex >= day.questions.length - 1) {
      updateGrammarDay(day.id, (previous) => ({
        ...previous,
        completed: true,
        completedAt: new Date().toISOString(),
        currentQuestionIndex: day.questions.length,
      }));
      setQuestionIndex(day.questions.length);
      return;
    }
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    updateGrammarDay(day.id, (previous) => ({ ...previous, currentQuestionIndex: nextIndex }));
  }

  function redoLesson() {
    setExerciseStarted(true);
    setQuestionIndex(0);
    setSelected({});
    setResults({});
    updateGrammarDay(day.id, (previous) => ({
      ...previous,
      completed: false,
      currentQuestionIndex: 0,
      dailyAnswers: {},
      dailyResults: {},
    }));
  }

  const isFinished = questionIndex >= day.questions.length;
  const progressLabel = useMemo(() => `${Math.min(answeredCount, day.questions.length)}/${day.questions.length} câu đã chấm`, [answeredCount, day.questions.length]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-accent-quizlet">
          Điểm ngữ pháp {grammarPointIndex + 1}/{day.grammarPoints.length}
        </p>
        {point && (
          <article key={point.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-white" lang="ja"><GrammarTitle point={point} /></h2>
            <div className="mt-4 space-y-3">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-accent-quizlet">Nghĩa</p><p className="mt-1 text-sm leading-6 text-primary-200">{point.meaningVi}</p></div>
              <div className="mt-4 overflow-hidden border border-white/10 bg-slate-950/40"><p className="bg-slate-950/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-accent-quizlet">Cấu trúc</p><ul className="grammar-structures space-y-1 p-1.5 text-sm text-primary-100" lang="ja"><GrammarStructures structures={point.structures} /></ul></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-accent-quizlet">Cách dùng</p><p className="mt-1 text-sm leading-6 text-primary-300">{point.usageVi}</p></div>
            </div>
            <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-bold text-primary-400">Ví dụ</p><div className="mt-3 space-y-4" lang="ja">{point.examples.map((example) => <div key={example.id}><p className="text-sm leading-7 text-primary-100"><TextSegments segments={example.segments} /> {example.paraphraseJa && <span className="text-primary-500">{formatParaphraseJa(example.paraphraseJa)}</span>}</p>{showTranslations && <p className="mt-1 text-xs leading-5 text-accent-quizlet/90" lang="vi">{example.translationVi}</p>}</div>)}</div></div>
          </article>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goToGrammarPoint(grammarPointIndex - 1)}
            disabled={grammarPointIndex === 0}
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-primary-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-accent-quizlet"
          >
            Trước
          </button>
          <span aria-live="polite" className="text-xs text-primary-400">
            Card {grammarPointIndex + 1} / {day.grammarPoints.length}
          </span>
          <button
            type="button"
            onClick={() => goToGrammarPoint(grammarPointIndex + 1)}
            disabled={grammarPointIndex === lastGrammarPointIndex}
            className="rounded-xl bg-accent-quizlet px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-quizlet-hover disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus:ring-2 focus:ring-accent-quizlet"
          >
            Tiếp theo
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <label className="grammar-translation-toggle inline-flex cursor-pointer items-center gap-2 rounded-lg border border-accent-quizlet/30 bg-accent-quizlet/5 px-2.5 py-1.5 text-xs font-bold text-primary-100 transition hover:border-accent-quizlet/60 hover:bg-accent-quizlet/10">
          <input type="checkbox" role="switch" aria-checked={showTranslations} aria-label="Hiện nghĩa ví dụ" checked={showTranslations} onChange={(event) => setShowTranslations(event.target.checked)} className="peer sr-only" />
          <span aria-hidden="true" className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors peer-focus:ring-2 peer-focus:ring-accent-quizlet ${showTranslations ? 'bg-accent-quizlet' : 'bg-primary-700'}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${showTranslations ? 'translate-x-4' : ''}`} /></span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-accent-quizlet" />Hiện nghĩa</span>
        </label>
      </div>

      {!grammarCompleted && <p className="rounded-xl border border-dashed border-accent-quizlet/30 bg-accent-quizlet/5 px-4 py-3 text-sm text-primary-300">Hãy xem hết các card ngữ pháp trước khi bắt đầu 7 câu luyện tập.</p>}

      {grammarCompleted && <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-accent-quizlet">Luyện tập</p><h2 className="mt-1 text-2xl font-black">7 câu của ngày {day.dayNumber}</h2></div><span className="text-xs text-primary-400">{progressLabel}</span></div>
        {!exerciseStarted && <div className="mt-6 rounded-xl border border-dashed border-white/20 px-4 py-8 text-center"><p className="text-sm text-primary-300">Học xong các điểm ngữ pháp? Bạn sẽ làm tuần tự từng câu, chấm xong mới chuyển câu tiếp theo.</p><button type="button" onClick={startExercise} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-quizlet px-5 py-3 text-sm font-bold text-white hover:bg-accent-quizlet-hover focus:outline-none focus:ring-2 focus:ring-accent-quizlet"><ArrowRight className="h-4 w-4" />Bắt đầu luyện tập</button></div>}
        {exerciseStarted && !isFinished && question && <div className="mt-6"><div className="mb-5 flex items-center justify-between text-xs text-primary-400"><span>Câu {questionIndex + 1}/{day.questions.length}</span><span className="h-1.5 w-40 overflow-hidden rounded-full bg-primary-800"><span className="block h-full bg-accent-quizlet transition-all" style={{ width: `${((questionIndex + (result ? 1 : 0)) / day.questions.length) * 100}%` }} /></span></div><GrammarQuestion question={question} selectedOptionId={currentAnswer} onSelect={chooseAnswer} disabled={Boolean(result) || checking} result={result} showResult={Boolean(result)} />{error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}<div className="mt-5 flex justify-end">{result ? <button type="button" onClick={nextQuestion} className="inline-flex items-center gap-2 rounded-xl bg-accent-quizlet px-5 py-3 text-sm font-bold hover:bg-accent-quizlet-hover focus:outline-none focus:ring-2 focus:ring-accent-quizlet">{questionIndex === day.questions.length - 1 ? 'Hoàn thành ngày' : 'Câu tiếp theo'}<ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={checkAnswer} disabled={!canCheck} className="rounded-xl bg-accent-quizlet px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent-quizlet">{checking ? 'Đang chấm…' : 'Chấm câu'}</button>}</div></div>}
        {exerciseStarted && isFinished && <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-7 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" /><h3 className="mt-3 text-xl font-bold">Đã hoàn thành ngày {day.dayNumber}</h3><p className="mt-2 text-sm text-emerald-100/80">Bạn đã chấm đủ 7 câu. Điểm tốt nhất được giữ trên thiết bị.</p><button type="button" onClick={redoLesson} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-quizlet"><RotateCcw className="h-4 w-4" />Làm lại</button></div>}
      </section>}
    </div>
  );
}
