import { useEffect, useState } from 'react';
import { Check, Circle, Clock3, LockOpen } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import GrammarLayout, { Breadcrumb } from '@/components/grammar/GrammarLayout';
import { grammarApi } from '@/lib/api';
import { getDayProgress } from '@/lib/grammarProgress';

export default function GrammarWeekPage() {
  const { weekNumber } = useParams();
  const [week, setWeek] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    grammarApi.getWeek(weekNumber).then(({ data }) => setWeek(data)).catch(() => setError('Không tìm thấy tuần học này.'));
  }, [weekNumber]);

  return (
    <GrammarLayout eyebrow={`Soumatome N3 · Tuần ${weekNumber}`}>
      <section className="mx-auto max-w-4xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <Breadcrumb><Link to="/grammar" className="hover:text-white">Ngữ pháp</Link></Breadcrumb>
        {error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
        {week && <>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-sm font-bold text-accent-quizlet">Tuần {week.weekNumber}</p><h1 className="mt-2 text-3xl font-black">{week.titleVi}</h1><p className="mt-3 text-sm text-primary-300">Chọn bất kỳ ngày nào. Tất cả tuần đều mở sẵn.</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center"><p className="text-2xl font-black text-accent-quizlet">{week.days.filter((day) => getDayProgress(day.id).completed).length}/7</p><p className="text-xs text-primary-400">ngày hoàn thành</p></div>
          </div>
          <div className="mt-8 space-y-3">
            {week.days.map((day) => {
              const progress = getDayProgress(day.id);
              const completed = progress.completed;
              return <Link key={day.id} to={`/grammar/weeks/${week.weekNumber}/days/${day.dayNumber}`} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-colors hover:border-accent-quizlet/50 focus:outline-none focus:ring-2 focus:ring-accent-quizlet sm:p-5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${completed ? 'bg-emerald-400/15 text-emerald-300' : day.kind === 'REVIEW' ? 'bg-accent-quizlet/15 text-accent-quizlet' : 'bg-white/10 text-primary-200'}`}>{completed ? <Check className="h-5 w-5" /> : day.dayNumber}</span>
                <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-bold">Ngày {day.dayNumber}{day.kind === 'REVIEW' && <span className="rounded-full bg-accent-quizlet/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent-quizlet">Tổng hợp</span>}</span><span className="mt-1 block text-xs text-primary-400">{day.kind === 'REVIEW' ? '25 câu · 100 điểm · 15 phút' : `${day.grammarPointCount} điểm ngữ pháp · 7 câu luyện tập`}</span></span>
                <span className="hidden items-center gap-1 text-xs text-primary-500 sm:flex">{day.kind === 'REVIEW' ? <Clock3 className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />} Mở sẵn</span>
                {!completed && <Circle className="h-4 w-4 text-primary-600" />}
              </Link>;
            })}
          </div>
        </>}
        {!week && !error && <div className="mt-8 h-96 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}
      </section>
    </GrammarLayout>
  );
}
