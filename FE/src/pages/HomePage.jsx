import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BarChart3,
  Sparkles,
  Play,
  ListOrdered,
  Search,
  Keyboard,
  Layers,
  Zap,
  CheckCircle2,
  X,
  Shuffle,
  ChevronRight,
} from 'lucide-react';
import { vocabularyApi } from '@/lib/api';
import { Toaster, toast } from 'sonner';

export default function HomePage() {
  const [sets, setSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'part1', 'part2'
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

  // Filtered sets memoized calculation
  const filteredSets = useMemo(() => {
    return sets.filter((set) => {
      // 1. Search Query Filter
      const matchSearch =
        searchQuery.trim() === '' ||
        set.name.toLowerCase().includes(searchQuery.toLowerCase().trim());

      // Extract lesson number
      const lessonNum = parseInt(set.name.match(/\d+/)?.[0] || '0', 10);

      // 2. Part Filter
      let matchFilter = true;
      if (activeFilter === 'part1') {
        matchFilter = lessonNum >= 1 && lessonNum <= 6;
      } else if (activeFilter === 'part2') {
        matchFilter = lessonNum >= 7 && lessonNum <= 12;
      }

      return matchSearch && matchFilter;
    });
  }, [sets, searchQuery, activeFilter]);

  // Calculate stats
  const totalWords = useMemo(() => {
    return sets.reduce((sum, item) => sum + (item.totalWords || 0), 0);
  }, [sets]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-accent-orange selection:text-white">
      <Toaster position="top-right" theme="dark" />

      {/* 1. Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/10 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-orange via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-accent-orange/30 transform hover:scale-105 transition-transform">
              <span className="text-xl font-bold font-japanese text-slate-950">単</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-gradient">Tango N3</h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-accent-orange/20 border border-accent-orange/30 text-accent-orange">
                  Mimikara
                </span>
              </div>
              <p className="text-xs text-primary-400 font-medium hidden sm:block">
                Hệ thống Học Từ Vựng JLPT N3 Chuyên Sâu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-900/60 border border-white/10 text-primary-300">
              <BookOpen className="w-3.5 h-3.5 text-accent-orange" />
              <span>{sets.length || 12} Bài Học</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-900/60 border border-white/10 text-primary-300">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>{totalWords || 880} Từ Vựng</span>
            </div>
            <button
              onClick={() => {
                if (sets.length > 0) {
                  const randomSet = sets[Math.floor(Math.random() * sets.length)];
                  navigate(`/study/${randomSet.id}`);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent-orange to-amber-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-accent-orange/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Học bài ngẫu nhiên</span>
              <span className="sm:hidden">Ngẫu nhiên</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner & Stats Dashboard */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-orange/15 via-slate-900/40 to-transparent">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-orange/10 border border-accent-orange/25 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent-orange" />
            <span className="text-xs font-bold text-accent-orange uppercase tracking-widest">
              Lộ trình Chuẩn JLPT N3 • Mimikara Oboeru
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-5 leading-tight sm:leading-none">
            Chinh phục <span className="text-gradient">Từ Vựng N3</span> Siêu Tốc
          </h2>

          <p className="text-primary-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Ghi nhớ <strong className="text-white">880 từ vựng cốt lõi</strong> thông qua bài tập gõ phản xạ Hiragana & Flashcard 2 mặt thông minh. Mặc định giữ <span className="text-accent-orange font-semibold">thứ tự chuẩn sách JSON</span>, bật xáo trộn khi cần.
          </p>

          {/* 4 Interactive Feature Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-primary-900/40 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:border-accent-orange/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent-orange/15 border border-accent-orange/30 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-accent-orange" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">12 Bài Học</h3>
                <p className="text-xs text-primary-400">Mimikara Oboeru</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary-900/40 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:border-accent-orange/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">880 Từ Vựng</h3>
                <p className="text-xs text-primary-400">Kanji & Hiragana</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary-900/40 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:border-accent-orange/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Keyboard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gõ Hiragana</h3>
                <p className="text-xs text-primary-400">Luyện phản xạ nhanh</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary-900/40 border border-white/10 backdrop-blur-md flex items-center gap-3 hover:border-accent-orange/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Flashcards</h3>
                <p className="text-xs text-primary-400">Lật thẻ 2 mặt tự động</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Toolbar (Search & Category Filters) */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-primary-900/60 p-1.5 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/25'
                    : 'text-primary-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Tất cả bài học ({sets.length})
              </button>
              <button
                onClick={() => setActiveFilter('part1')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === 'part1'
                    ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/25'
                    : 'text-primary-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Phần 1 (Bài 1 - 6)
              </button>
              <button
                onClick={() => setActiveFilter('part2')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === 'part2'
                    ? 'bg-accent-orange text-white shadow-md shadow-accent-orange/25'
                    : 'text-primary-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Phần 2 (Bài 7 - 12)
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-primary-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học (vd: Bài 1, 10...)"
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-primary-900/60 border border-white/10 text-white text-xs font-medium placeholder:text-primary-500 focus:outline-none focus:border-accent-orange transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4. Lesson Grid View */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl p-6 bg-primary-900/30 border border-white/10 animate-pulse h-48 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-primary-800 rounded-full w-20" />
                    <div className="h-4 bg-primary-800 rounded-full w-16" />
                  </div>
                  <div className="h-8 bg-primary-800 rounded-lg w-3/4 mb-4" />
                  <div className="h-10 bg-primary-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredSets.length === 0 ? (
            <div className="text-center py-20 bg-primary-900/30 border border-white/10 rounded-2xl p-8 max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center text-accent-orange">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy bài học nào</h3>
              <p className="text-xs text-primary-400 mb-6">
                Không tìm thấy kết quả phù hợp với từ khóa &quot;{searchQuery}&quot;. Vui lòng thử tìm bài học khác.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-accent-orange text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSets.map((set) => {
                const lessonMatch = set.name.match(/\d+/);
                const lessonNumber = lessonMatch ? lessonMatch[0].padStart(2, '0') : '01';

                return (
                  <div
                    key={set.id}
                    className="group relative rounded-2xl p-6 bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-accent-orange/40 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-accent-orange/10 flex flex-col justify-between overflow-hidden"
                  >
                    {/* Glowing Top Accent on Hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-orange via-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Top Meta Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-accent-orange/15 text-accent-orange border border-accent-orange/30">
                          BÀI {lessonNumber}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-primary-400 bg-primary-900/80 px-2.5 py-1 rounded-full border border-white/5 font-semibold">
                          <BarChart3 className="w-3.5 h-3.5 text-accent-orange" />
                          <span>{set.totalWords} Từ vựng</span>
                        </div>
                      </div>

                      {/* Lesson Title */}
                      <h3 className="text-xl font-bold text-white group-hover:text-accent-orange transition-colors mb-2 leading-snug">
                        {set.name}
                      </h3>

                      <p className="text-xs text-primary-400 flex items-center gap-1 mb-6">
                        <ListOrdered className="w-3.5 h-3.5 text-accent-orange shrink-0" />
                        Thứ tự chuẩn từ file JSON
                      </p>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => navigate(`/study/${set.id}`)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-accent-orange to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-accent-orange/20 hover:brightness-110 active:scale-95 transition-all"
                        title="Vào bài tập gõ Hiragana"
                      >
                        <Keyboard className="w-4 h-4" />
                        <span>Cách đọc</span>
                      </button>

                      <button
                        onClick={() => navigate(`/flashcards/${set.id}`)}
                        className="py-2.5 px-3 rounded-xl bg-primary-800/80 hover:bg-primary-700 text-primary-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 hover:border-white/20 active:scale-95 transition-all"
                        title="Vào bài ôn Flashcard 2 mặt"
                      >
                        <Layers className="w-4 h-4 text-accent-orange" />
                        <span>Flashcard</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 bg-slate-950 text-center text-xs text-primary-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-japanese font-bold text-accent-orange">単</span>
            <span>Tango N3 Mimikara Oboeru Vocabulary</span>
          </div>
          <p>© 2026 Tango N3. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
