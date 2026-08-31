import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { BookOpen } from 'lucide-react';
import { vocabularyApi } from '@/lib/api';

const getLessonNumber = (name = '') => Number(name.match(/\d+/)?.[0] || Number.MAX_SAFE_INTEGER);
const supportedLevels = new Set(['N2', 'N3']);

export default function HomePage() {
  const [sets, setSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedLevel = searchParams.get('level');
  const level = supportedLevels.has(requestedLevel) ? requestedLevel : 'N3';

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);

    vocabularyApi.getSets(level)
      .then(({ data }) => {
        if (isActive) setSets(data);
      })
      .catch((error) => {
        console.error('Failed to fetch sets:', error);
        toast.error('Không thể tải danh sách bài học');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, [level]);

  const lessonSets = useMemo(() => (
    [...sets]
      .sort((firstSet, secondSet) => getLessonNumber(firstSet.name) - getLessonNumber(secondSet.name))
      .slice(0, 12)
  ), [sets]);

  const units = useMemo(() => {
    const grouped = new Map();
    sets.forEach((set) => {
      if (!Number.isInteger(set.unitNumber)) return;
      if (!grouped.has(set.unitNumber)) grouped.set(set.unitNumber, []);
      grouped.get(set.unitNumber).push(set);
    });

    return [...grouped.entries()]
      .sort(([first], [second]) => first - second)
      .map(([unitNumber, parts]) => ({
        unitNumber,
        title: parts[0]?.unitTitle || `Unit ${unitNumber}`,
        parts: parts.sort((first, second) => first.partNumber - second.partNumber),
      }));
  }, [sets]);

  const selectLevel = (nextLevel) => {
    setSearchParams(nextLevel === 'N3' ? {} : { level: nextLevel });
  };

  return (
    <div className='min-h-screen bg-slate-950 text-white'>
      <Toaster position='top-right' theme='dark' />

      <header className='sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-8'>
          <span className='text-sm font-extrabold tracking-tight'>Tango {level}</span>
          <nav aria-label='Khu vực học' className='flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1'>
            <span className='rounded-lg bg-accent-quizlet px-3 py-2 text-xs font-bold text-white'>
              <BookOpen className='mr-1.5 inline h-3.5 w-3.5' />Từ vựng
            </span>
          </nav>
        </div>
      </header>

      <main className='mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10' aria-label='Danh sách bài học'>
        <div className='mb-6 flex w-full rounded-2xl border border-white/10 bg-white/[0.04] p-1' role='tablist' aria-label='Cấp độ từ vựng'>
          {['N3', 'N2'].map((candidate) => (
            <button
              key={candidate}
              type='button'
              role='tab'
              aria-selected={level === candidate}
              onClick={() => selectLevel(candidate)}
              className={`min-h-11 flex-1 rounded-xl text-sm font-extrabold transition ${level === candidate ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
            >
              {candidate}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className='space-y-1' aria-busy='true' aria-label='Đang tải bài học'>
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className='h-14 animate-pulse border-b border-white/10 bg-white/[0.03]' />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <p className='py-10 text-center text-sm text-slate-400' role='status'>Chưa có bài học nào.</p>
        ) : level === 'N2' ? (
          <div className='space-y-5'>
            {units.map((unit) => (
              <section key={unit.unitNumber} className='rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5'>
                <h2 className='mb-3 text-lg font-extrabold text-indigo-200'>{unit.title}</h2>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {unit.parts.map((set) => (
                    <button
                      key={set.id}
                      type='button'
                      onClick={() => navigate(`/study/${set.id}`)}
                      className={`min-h-14 rounded-xl border px-4 py-3 text-left font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${set.isSummary ? 'border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15' : 'border-white/10 bg-slate-900/60 text-slate-100 hover:border-indigo-400/50 hover:text-indigo-200'}`}
                    >
                      {set.partTitle || `${set.rangeStart}–${set.rangeEnd}`}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className='divide-y divide-white/10'>
            {lessonSets.map((set) => (
              <button
                key={set.id}
                type='button'
                onClick={() => navigate(`/study/${set.id}`)}
                className='group flex min-h-14 w-full items-center py-3 text-left text-xl font-bold leading-tight text-slate-100 transition-colors hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:min-h-16 sm:py-4 sm:text-2xl'
              >
                <span>{set.name}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
