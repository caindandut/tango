import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GrammarLayout, { Breadcrumb } from '@/components/grammar/GrammarLayout';
import GrammarLessonView from '@/components/grammar/GrammarLessonView';
import GrammarReviewView from '@/components/grammar/GrammarReviewView';
import { grammarApi } from '@/lib/api';

export default function GrammarDayPage() {
  const { weekNumber, dayNumber } = useParams();
  const [day, setDay] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    grammarApi.getDay(weekNumber, dayNumber).then(({ data }) => setDay(data)).catch(() => setError('Không thể tải nội dung ngày học này.'));
  }, [dayNumber, weekNumber]);

  return <GrammarLayout eyebrow={`Soumatome N3 · Tuần ${weekNumber} · Ngày ${dayNumber}`}><section className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 lg:px-8"><Breadcrumb><Link to="/grammar" className="hover:text-white">Ngữ pháp</Link><Link to={`/grammar/weeks/${weekNumber}`} className="hover:text-white">Tuần {weekNumber}</Link></Breadcrumb>{error && <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>}{day && <><div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-accent-quizlet">{day.kind === 'REVIEW' ? 'Ngày 7 · Ôn tập' : `Ngày ${day.dayNumber} · Học và luyện tập`}</p><h1 className="mt-2 text-3xl font-black tracking-tight">{day.titleVi || `Ngày ${day.dayNumber}`}</h1></div><Link to={`/grammar/weeks/${weekNumber}`} className="text-xs font-bold text-primary-300 hover:text-white">← Về danh sách tuần</Link></div>{day.kind === 'REVIEW' ? <GrammarReviewView day={day} /> : <GrammarLessonView day={day} />}</>}{!day && !error && <div className="h-96 animate-pulse rounded-2xl bg-white/5" aria-busy="true" />}</section></GrammarLayout>;
}
