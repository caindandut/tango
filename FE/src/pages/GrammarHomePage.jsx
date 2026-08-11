import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GrammarLayout from '@/components/grammar/GrammarLayout';
import { grammarApi } from '@/lib/api';

export default function GrammarHomePage() {
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    grammarApi.getWeeks()
      .then(({ data }) => setWeeks(data.weeks || []))
      .catch(() => setError('Không thể tải danh sách bài ngữ pháp.'));
  }, []);

  return (
    <GrammarLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Ngữ pháp N3</h1>
        <p className="mt-2 text-sm text-primary-300">Chọn một tuần để bắt đầu học.</p>

        {error && <p role="alert" className="mt-6 border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}

        {weeks.length > 0 && (
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {weeks.map((week) => (
              <Link
                key={week.weekNumber}
                to={`/grammar/weeks/${week.weekNumber}`}
                className="group flex min-h-16 items-center gap-4 py-4 text-left transition-colors hover:text-accent-orange focus:outline-none focus-visible:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-orange"
              >
                <span className="text-lg font-bold text-white transition-colors group-hover:text-accent-orange">{week.titleVi || `Tuần ${week.weekNumber}`}</span>
              </Link>
            ))}
          </div>
        )}

        {!weeks.length && !error && (
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10" aria-busy="true" aria-label="Đang tải danh sách tuần">
            {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-16 animate-pulse bg-white/[0.03]" />)}
          </div>
        )}
      </section>
    </GrammarLayout>
  );
}
