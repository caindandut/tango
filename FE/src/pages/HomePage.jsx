import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { vocabularyApi } from '@/lib/api';
import { BookOpen } from 'lucide-react';

const getLessonNumber = (name = '') => Number(name.match(/\d+/)?.[0] || Number.MAX_SAFE_INTEGER);

export default function HomePage() {
  const [sets, setSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const { data } = await vocabularyApi.getSets();
        setSets(data);
      } catch (err) {
        console.error('Failed to fetch sets:', err);
        toast.error('Không thể tải danh sách bài học');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSets();
  }, []);

  const lessonSets = [...sets]
    .sort((firstSet, secondSet) => getLessonNumber(firstSet.name) - getLessonNumber(secondSet.name))
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster position="top-right" theme="dark" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <span className="text-sm font-extrabold tracking-tight">Tango N3</span>
          <nav aria-label="Khu vực học" className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <span className="rounded-lg bg-accent-quizlet px-3 py-2 text-xs font-bold text-white"><BookOpen className="mr-1.5 inline h-3.5 w-3.5" />Từ vựng</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10" aria-label="Danh sách bài học">
        {isLoading ? (
          <div className="space-y-1" aria-busy="true" aria-label="Đang tải bài học">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className="h-14 animate-pulse border-b border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : lessonSets.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400" role="status">
            Chưa có bài học nào.
          </p>
        ) : (
          <div className="divide-y divide-white/10">
            {lessonSets.map((set) => (
              <button
                key={set.id}
                type="button"
                onClick={() => navigate(`/study/${set.id}`)}
                className="group flex min-h-14 w-full items-center py-3 text-left text-xl font-bold leading-tight text-slate-100 transition-colors hover:text-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:min-h-16 sm:py-4 sm:text-2xl"
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
