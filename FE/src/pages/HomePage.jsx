import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BarChart3, Sparkles, Shuffle, Play } from 'lucide-react';
import { vocabularyApi } from '@/lib/api';
import { Toaster, toast } from 'sonner';

export default function HomePage() {
  const [sets, setSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSets();
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <header className="py-6 px-8 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center shadow-lg shadow-accent-orange/20">
              <span className="text-xl font-bold font-japanese">単</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Tango N3</h1>
              <p className="text-xs text-primary-400">Mimikara Oboeru Vocabulary</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-10 px-8 text-center bg-gradient-to-b from-transparent via-primary-800/20 to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-orange/10 border border-accent-orange/20 mb-4">
            <Sparkles className="w-4 h-4 text-accent-orange" />
            <span className="text-xs font-semibold text-accent-orange uppercase tracking-wider">
              Chế độ Nhồi Nhét • Từ vựng N3
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Chinh phục <span className="text-gradient">Từ Vựng JLPT N3</span>
          </h2>
          <p className="text-primary-300 text-base md:text-lg max-w-xl mx-auto">
            Chọn bài học để bắt đầu. Mỗi lượt học sẽ <span className="text-accent-orange font-semibold">tự động đảo lộn từ vựng</span> giúp ghi nhớ sâu và phản xạ gõ Hiragana tức thì.
          </p>
        </div>
      </section>

      {/* Vocabulary Lessons Grid */}
      <section className="flex-1 px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-orange" />
              Danh sách Bài Học ({sets.length} Bài)
            </h3>
            <span className="text-xs text-primary-400 flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5 text-accent-orange" />
              Đảo lộn thứ tự ngẫu nhiên mỗi lần học
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="vocab-set-card animate-pulse">
                  <div className="h-6 bg-primary-700/50 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-primary-700/50 rounded w-1/3 mb-4" />
                  <div className="h-10 bg-primary-700/50 rounded" />
                </div>
              ))}
            </div>
          ) : sets.length === 0 ? (
            <div className="text-center py-16 study-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-700/50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-primary-300 text-lg font-medium mb-1">Đang nạp dữ liệu Bài học N3...</p>
              <p className="text-primary-400 text-sm">
                Vui lòng đợi vài giây để hệ thống hoàn tất phân tích dữ liệu N3 từ sách Mimikara.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className="vocab-set-card group hover:border-accent-orange/40 transition-all flex flex-col justify-between"
                  onClick={() => navigate(`/study/${set.id}`)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-accent-orange/15 text-accent-orange border border-accent-orange/25">
                        JLPT N3
                      </span>
                      <span className="text-xs text-primary-400 flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-accent-orange" />
                        {set.totalWords} từ vựng
                      </span>
                    </div>

                    <h4 className="font-bold text-xl group-hover:text-accent-orange transition-colors mb-2">
                      {set.name}
                    </h4>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <span className="text-xs text-primary-400 flex items-center gap-1">
                      <Shuffle className="w-3 h-3 text-accent-orange" /> Random Shuffle
                    </span>
                    <button className="px-4 py-2 rounded-lg bg-accent-orange text-white text-sm font-semibold flex items-center gap-1.5 group-hover:bg-accent-orange-hover transition-colors shadow-md shadow-accent-orange/20">
                      <Play className="w-3.5 h-3.5 fill-current" /> Học ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
