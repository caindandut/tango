import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GrammarLayout from '@/components/grammar/GrammarLayout';
import { grammarApi } from '@/lib/api';
import { countCompletedDays } from '@/lib/grammarProgress';

export default function GrammarHomePage() {
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    grammarApi.getWeeks().then(({ data }) => setWeeks(data.weeks || [])).catch(() => setError('Không thể tải lộ trình ngữ pháp.'));
  }, []);

  return (
    <GrammarLayout>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Ngữ pháp N3, từng ngày một.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-300 sm:text-base">Sáu tuần theo Soumatome. Mỗi ngày học các điểm ngữ pháp, luyện 7 câu; ngày thứ 7 là bài tổng hợp 25 câu trong 15 phút.</p>
        </div>
        {error && <p role="alert" className="mt-8 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weeks.map((week) => {
            const completed = countCompletedDays(week.days);
            return (
              <Link key={week.weekNumber} to={`/grammar/weeks/${week.weekNumber}`} className="group rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition-transform hover:-translate-y-1 hover:border-accent-orange/60 focus:outline-none focus:ring-2 focus:ring-accent-orange">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-orange">Tuần {week.weekNumber}</p>
                    <h2 className="mt-2 text-xl font-bold">{week.titleVi || `Tuần ${week.weekNumber}`}</h2>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary-500 transition-transform group-hover:translate-x-1 group-hover:text-accent-orange" />
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-primary-300">
                  <span><CheckCircle2 className="mr-1.5 inline h-4 w-4 text-emerald-400" />{completed}/7 ngày hoàn thành</span>
                  <span><Layers3 className="mr-1 inline h-4 w-4" />6 bài học + ôn tập</span>
                </div>
              </Link>
            );
          })}
        </div>
        {!weeks.length && !error && <div className="mt-10 grid gap-4 md:grid-cols-3" aria-busy="true">{[1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}</div>}
      </section>
      <section className="mx-auto grid max-w-7xl gap-3 px-4 pb-8 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"><Layers3 className="mb-3 h-5 w-5 text-accent-orange" /><p className="font-bold">36 ngày học</p><p className="mt-1 text-xs leading-5 text-primary-400">Hiện đủ nghĩa, cấu trúc và toàn bộ ví dụ Nhật–Việt.</p></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"><Clock3 className="mb-3 h-5 w-5 text-accent-orange" /><p className="font-bold">6 bài tổng hợp</p><p className="mt-1 text-xs leading-5 text-primary-400">25 câu, 100 điểm, đồng hồ 15 phút.</p></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm"><CheckCircle2 className="mb-3 h-5 w-5 text-accent-orange" /><p className="font-bold">Tiến độ trên thiết bị</p><p className="mt-1 text-xs leading-5 text-primary-400">Tải lại trang vẫn giữ ngày đang học và điểm tốt nhất.</p></div>
      </section>
    </GrammarLayout>
  );
}
