import { BookOpen, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function GrammarLayout({ children, eyebrow = 'Soumatome N3 · 文法' }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Về trang Từ vựng">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-quizlet font-japanese text-xl font-bold text-slate-950">単</span>
            <span className="hidden text-sm font-extrabold tracking-tight sm:block">Tango N3</span>
          </Link>
          <nav aria-label="Khu vực học" className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            <Link to="/" className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${location.pathname === '/' ? 'bg-accent-quizlet text-white' : 'text-primary-300 hover:bg-accent-quizlet/10 hover:text-white'}`}>
              <BookOpen className="mr-1.5 inline h-3.5 w-3.5" />Từ vựng
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-quizlet">{eyebrow}</p>
        </div>
        {children}
      </main>
      <footer className="mx-auto mt-16 max-w-7xl border-t border-white/10 px-4 py-8 text-center text-xs text-primary-500 sm:px-6 lg:px-8">
        <p>Học theo nhịp sách · Nội dung Nhật–Việt được kiểm tra từ bản scan.</p>
      </footer>
    </div>
  );
}

export function Breadcrumb({ children }) {
  return <div className="mb-4 flex items-center gap-1 text-xs text-primary-400">{children}<ChevronRight className="h-3.5 w-3.5" /></div>;
}
