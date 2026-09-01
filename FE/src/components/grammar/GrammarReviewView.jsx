import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Play, Send, RotateCcw } from 'lucide-react';
import GrammarQuestion from './GrammarQuestion';
import TextSegments from './TextSegments';
import { grammarApi } from '@/lib/api';
import { formatRemainingTime, getDayProgress, updateGrammarDay } from '@/lib/grammarProgress';

export default function GrammarReviewView({ day }) {
  const stored = getDayProgress(day.id);
  const [startedAt, setStartedAt] = useState(stored.reviewStartedAt || null);
  const [answers, setAnswers] = useState(stored.reviewAnswers || {});
  const [result, setResult] = useState(stored.reviewResult || null);
  const [remaining, setRemaining] = useState(() => stored.reviewStartedAt ? Math.max(0, day.timeLimitSeconds - Math.floor((Date.now() - stored.reviewStartedAt) / 1000)) : day.timeLimitSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submittedRef = useRef(Boolean(result));

  const submit = useCallback(async () => {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, answerOptionId]) => ({ questionId, answerOptionId }));
      const { data } = await grammarApi.gradeReview(day.weekNumber, payload);
      setResult(data);
      updateGrammarDay(day.id, (previous) => ({
        ...previous,
        completed: true,
        reviewResult: data,
        reviewAnswers: answers,
        bestScore: Math.max(previous.bestScore || 0, data.score),
        completedAt: new Date().toISOString(),
      }));
    } catch {
      submittedRef.current = false;
      setError('Không thể nộp bài. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, day.id, day.weekNumber, submitting]);

  useEffect(() => {
    if (!startedAt || result) return undefined;
    const tick = () => {
      const next = Math.max(0, day.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000));
      setRemaining(next);
      if (next === 0) submit();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [day.timeLimitSeconds, result, startedAt, submit]);

  function begin() {
    const timestamp = Date.now();
    setStartedAt(timestamp);
    setRemaining(day.timeLimitSeconds);
    submittedRef.current = false;
    updateGrammarDay(day.id, (previous) => ({ ...previous, reviewStartedAt: timestamp, reviewAnswers: {}, reviewResult: undefined, completed: false }));
  }

  function choose(questionId, optionId) {
    if (result) return;
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);
    updateGrammarDay(day.id, (previous) => ({ ...previous, reviewAnswers: nextAnswers }));
  }

  function redo() {
    setStartedAt(null);
    setResult(null);
    setAnswers({});
    setRemaining(day.timeLimitSeconds);
    submittedRef.current = false;
    updateGrammarDay(day.id, (previous) => ({ ...previous, completed: false, reviewStartedAt: undefined, reviewAnswers: {}, reviewResult: undefined }));
  }

  if (result) {
    return <ReviewResult day={day} result={result} onRedo={redo} />;
  }
  if (!startedAt) {
    return <section className="rounded-2xl border border-accent-quizlet/30 bg-accent-quizlet/5 p-6 text-center sm:p-10"><Clock3 className="mx-auto h-10 w-10 text-accent-quizlet" /><h2 className="mt-4 text-2xl font-black">Bài tổng hợp tuần {day.weekNumber}</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-primary-300">25 câu · 100 điểm · 15 phút. Đáp án và lời giải chỉ hiện sau khi bạn nộp toàn bộ bài.</p><button type="button" onClick={begin} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-accent-quizlet px-6 py-3 text-sm font-bold hover:bg-accent-quizlet-hover focus:outline-none focus:ring-2 focus:ring-accent-quizlet"><Play className="h-4 w-4" />Bắt đầu tính giờ</button></section>;
  }

  return <section className="space-y-6"><div className={`sticky top-[4.5rem] z-20 flex items-center justify-between rounded-xl border px-4 py-3 backdrop-blur-xl ${remaining <= 60 ? 'border-red-400/60 bg-red-950/90 text-red-100' : 'border-white/10 bg-slate-900/95'}`}><span className="flex items-center gap-2 text-sm font-bold"><Clock3 className="h-4 w-4 text-accent-quizlet" />Còn lại</span><span className="font-mono text-xl font-black" aria-live="polite">{formatRemainingTime(remaining)}</span></div><div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-primary-300"><AlertTriangle className="mr-2 inline h-4 w-4 text-accent-quizlet" />Chưa nộp bài sẽ được tính là sai. Bạn có thể nộp sớm bất cứ lúc nào.</div>{day.questions.map((question, index) => <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6"><p className="mb-4 text-xs font-bold uppercase tracking-wider text-accent-quizlet">Câu {index + 1}</p>{question.type === 'REVIEW_CLOZE' && index === 20 && day.passages?.[0] && <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-primary-200" lang="ja"><TextSegments segments={day.passages[0].segments} /></div>}<GrammarQuestion question={question} selectedOptionId={answers[question.id]} onSelect={(optionId) => choose(question.id, optionId)} /><span className="sr-only">{answers[question.id] ? `Đã chọn ${answers[question.id]}` : 'Chưa chọn đáp án'}</span></div>)}<div className="flex flex-col items-stretch justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center"><span className="text-xs text-primary-400">Đã chọn {Object.keys(answers).length}/25 câu</span><button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-quizlet px-6 py-3 text-sm font-bold disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent-quizlet"><Send className="h-4 w-4" />{submitting ? 'Đang nộp…' : 'Nộp bài'}</button></div>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}</section>;
}

function ReviewResult({ day, result, onRedo }) {
  const resultMap = new Map(result.results.map((item) => [item.questionId, item]));
  return <section className="space-y-6"><div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center sm:p-10"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" /><p className="mt-4 text-sm font-bold text-emerald-100">Đã nộp bài tổng hợp</p><p className="mt-1 text-5xl font-black text-white">{result.score}<span className="text-xl text-primary-300">/100</span></p><p className="mt-2 text-sm text-emerald-100/80">Đúng {result.correctCount}/{result.totalQuestions} câu · điểm tốt nhất được lưu trên thiết bị.</p><button type="button" onClick={onRedo} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-quizlet"><RotateCcw className="h-4 w-4" />Làm lại bài</button></div>{day.questions.map((question, index) => <div key={question.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6"><p className="mb-4 text-xs font-bold uppercase tracking-wider text-accent-quizlet">Câu {index + 1}</p>{question.type === 'REVIEW_CLOZE' && index === 20 && day.passages?.[0] && <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-primary-200" lang="ja"><TextSegments segments={day.passages[0].segments} /></div>}<GrammarQuestion question={question} selectedOptionId={resultMap.get(question.id)?.selectedOptionId} onSelect={() => {}} disabled result={resultMap.get(question.id)} showResult /></div>)}</section>;
}
