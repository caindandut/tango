import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BarChart3,
  Sparkles,
  Search,
  Grid,
  List,
  Keyboard,
  Layers,
  Zap,
  X,
  Shuffle,
  ListOrdered
} from 'lucide-react';
import { vocabularyApi } from '@/lib/api';
import { Toaster, toast } from 'sonner';

export default function HomePage() {
  const [sets, setSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
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

  // Filter sets based on search query
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return sets;
    const query = searchQuery.toLowerCase().trim();
    return sets.filter(set =>
      set.name.toLowerCase().includes(query) ||
      `bài ${set.name}`.toLowerCase().includes(query)
    );
  }, [sets, searchQuery]);

  // Total vocabulary count across all loaded sets
  const totalVocabCount = useMemo(() => {
    return sets.reduce((acc, curr) => acc + (curr.totalWords || 0), 0);
  }, [sets]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white selection:bg-accent-orange selection:text-white relative overflow-hidden">
      <Toaster position="top-right" theme="dark" />

      {/* Decorative Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-orange/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0f172a]/80 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-orange via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-accent-orange/25 group-hover:scale-105 transition-transform duration-300">
              <span className="text-2xl font-black font-japanese text-white drop-shadow">単</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-gradient">Tango N3</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-accent-orange/15 text-accent-orange border border-accent-orange/30 rounded-full">
                  PRO MAX
                </span>
              </div>
              <p className="text-xs text-primary-400 font-medium">Mimikara Oboeru Vocabulary Master</p>
            </div>
          </div>

          {/* Quick Header Stats */}
          <div className="hidden md:flex items-center gap-6 text-xs text-primary-300">
            <div className="flex items-center gap-2 bg-primary-900/60 px-3.5 py-1.5 rounded-xl border border-white/5">
              <BookOpen className="w-4 h-4 text-accent-orange" />
              <span>Bài học: <strong className="text-white">{sets.length} Bài</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-primary-900/60 px-3.5 py-1.5 rounded-xl border border-white/5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Từ vựng: <strong className="text-white">{totalVocabCount || 880} từ</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative py-12 px-4 sm:px-8 bg-gradient-to-b from-primary-900/40 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-orange/10 border border-accent-orange/20 mb-6 shadow-inner animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent-orange animate-spin-slow" />
            <span className="text-xs font-bold text-accent-orange uppercase tracking-wider">
              Học Từ Vựng Chuẩn JLPT N3 • Phản Xạ Hiragana
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-[1.15]">
            Chinh Phục <span className="text-gradient">880 Từ Vựng N3</span> <br />
            Một Cách Tự Nhiên & Ghi Nhớ Sâu
          </h2>

          <p className="text-primary-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Luyện tập gõ romaji chuyển đổi Hiragana trực tiếp hoặc ôn tập nhanh bằng Flashcards.
            Mặc định theo <span className="text-accent-orange font-semibold">đúng thứ tự file JSON</span> sách Mimikara Oboeru.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-accent-orange font-semibold text-sm mb-1">
                <ListOrdered className="w-4 h-4" /> Thứ tự chuẩn
              </div>
              <p className="text-xs text-primary-400">Đúng thứ tự bài học sách Mimikara</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1">
                <Shuffle className="w-4 h-4" /> Công tắc Xáo trộn
              </div>
              <p className="text-xs text-primary-400">Bật/tắt đảo lộn từ vựng tùy ý</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                <Keyboard className="w-4 h-4" /> Gõ Romaji
              </div>
              <p className="text-xs text-primary-400">Tự động chuyển đổi từ romaji sang hiragana</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1">
                <Layers className="w-4 h-4" /> Flashcard Pro
              </div>
              <p className="text-xs text-primary-400">Lật thẻ bằng Space & điều hướng mũi tên</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 pb-20 max-w-7xl mx-auto w-full">
        {/* Controls Bar: Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-7 rounded-full bg-accent-orange" />
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">Danh sách Bài Học</h3>
              <p className="text-xs text-primary-400">Chọn bài học bên dưới để bắt đầu luyện tập</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học (vd: Bài 1)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-primary-900/60 border border-white/10 text-xs sm:text-sm text-white placeholder:text-primary-500 focus:outline-none focus:border-accent-orange/60 focus:ring-2 focus:ring-accent-orange/20 transition-all"
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

            {/* View Mode Toggle Switch */}
            <div className="flex items-center p-1 rounded-xl bg-primary-900/60 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-accent-orange text-white shadow-md' : 'text-primary-400 hover:text-white'
                }`}
                title="Lưới 3 cột"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-accent-orange text-white shadow-md' : 'text-primary-400 hover:text-white'
                }`}
                title="Danh sách hàng"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl p-6 bg-white/[0.03] border border-white/10 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-primary-700/50 rounded-lg w-24" />
                  <div className="h-5 bg-primary-700/50 rounded-lg w-16" />
                </div>
                <div className="h-8 bg-primary-700/50 rounded-lg w-3/4 mb-6" />
                <div className="h-11 bg-primary-700/50 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredSets.length === 0 ? (
          /* Empty / No Results State */
          <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/10 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-orange/10 border border-accent-orange/20 flex items-center justify-center text-accent-orange">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold mb-2">Không tìm thấy bài học phù hợp</h4>
            <p className="text-primary-400 text-sm mb-6">
              Không có bài học nào khớp với từ khóa "{searchQuery}". Vui lòng thử tìm từ khóa khác.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-5 py-2.5 rounded-xl bg-accent-orange text-white text-sm font-semibold hover:bg-accent-orange-hover transition-colors shadow-lg shadow-accent-orange/20"
            >
              Xóa tìm kiếm
            </button>
          </div>
        ) : (
          /* Lessons Grid or List View */
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'
            }
          >
            {filteredSets.map((set, index) => {
              // Extract numeric lesson number e.g. "Bài 1" -> 1
              const lessonNum = set.name.match(/\d+/)?.[0] || (index + 1);
              const formattedNum = String(lessonNum).padStart(2, '0');

              return (
                <div
                  key={set.id}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:from-white/[0.1] hover:to-white/[0.04] border border-white/10 hover:border-accent-orange/40 hover:shadow-xl hover:shadow-accent-orange/10 flex ${
                    viewMode === 'list'
                      ? 'flex-col sm:flex-row sm:items-center justify-between gap-4'
                      : 'flex-col justify-between h-full'
                  }`}
                >
                  {/* Top Card Section */}
                  <div className={viewMode === 'list' ? 'flex items-center gap-5 flex-1' : ''}>
                    {/* Lesson Index Number Circle */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-orange/15 border border-accent-orange/30 text-accent-orange font-black flex items-center justify-center text-sm shadow-inner group-hover:scale-110 group-hover:bg-accent-orange group-hover:text-white transition-all duration-300">
                        {formattedNum}
                      </div>

                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary-300 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-accent-orange" />
                        {set.totalWords} từ vựng
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xl sm:text-2xl group-hover:text-accent-orange transition-colors mb-1">
                        {set.name}
                      </h4>
                      <p className="text-xs text-primary-400">N3 Mimikara Oboeru Vocabulary</p>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div
                    className={`${
                      viewMode === 'list'
                        ? 'flex items-center gap-3 sm:w-auto w-full pt-0'
                        : 'mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2.5'
                    }`}
                  >
                    {/* Direct Mode Buttons */}
                    <button
                      onClick={() => navigate(`/study/${set.id}`)}
                      className="px-4 py-2.5 rounded-xl bg-accent-orange hover:bg-accent-orange-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-accent-orange/20 hover:shadow-accent-orange/30 active:scale-95 flex-1"
                      title="Học gõ Hiragana"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Cách đọc</span>
                    </button>

                    <button
                      onClick={() => navigate(`/flashcards/${set.id}`)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-white/10 active:scale-95 flex-1"
                      title="Ôn tập thẻ Flashcards"
                    >
                      <Layers className="w-3.5 h-3.5 text-accent-orange" />
                      <span>Flashcard</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Pro Tip Bar */}
      <footer className="py-8 px-4 sm:px-8 border-t border-white/10 bg-[#0b1120]/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-primary-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tango N3 Mimikara • Sẵn sàng cho kỳ thi JLPT N3</span>
          </div>
          <p>© {new Date().getFullYear()} Tango N3 App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
