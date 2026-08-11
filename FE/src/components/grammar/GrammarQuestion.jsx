import TextSegments from './TextSegments';

function optionLabel(id) {
  return id || '?';
}

export default function GrammarQuestion({
  question,
  selectedOptionId,
  onSelect,
  disabled = false,
  result,
  showResult = false,
}) {
  const isStar = question.type === 'STAR_CHOICE';
  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="sr-only">Câu hỏi {question.id}</legend>
      <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-5 text-lg leading-9 text-primary-100 sm:px-6" lang="ja">
        <TextSegments segments={question.promptSegments} />
        {isStar && <p className="mt-2 text-xs leading-5 text-primary-400" lang="vi">Chỉ chọn mảnh nằm ở vị trí ★.</p>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Các đáp án">
        {question.options.map((option) => {
          const checked = selectedOptionId === option.id;
          const isCorrect = showResult && option.id === result?.correctOptionId;
          const isWrong = showResult && checked && !result?.isCorrect;
          return (
            <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${checked ? 'border-accent-orange bg-accent-orange/10' : 'border-white/10 bg-white/[0.03] hover:border-white/30'} ${isCorrect ? 'border-emerald-400 bg-emerald-400/10' : ''} ${isWrong ? 'border-red-400 bg-red-400/10' : ''}`}>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="mt-1 h-4 w-4 accent-orange-500"
              />
              <span><span className="mr-2 font-bold text-accent-orange">{optionLabel(option.id)}.</span><span lang="ja">{option.text}</span></span>
            </label>
          );
        })}
      </div>
      {showResult && result && (
        <div role="status" aria-live="polite" className={`rounded-xl border px-4 py-4 text-sm ${result.isCorrect ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100' : 'border-red-400/50 bg-red-400/10 text-red-100'}`}>
          <p className="font-bold">{result.isCorrect ? '✓ Chính xác' : `✕ Chưa đúng · Đáp án: ${result.correctOptionId}`}</p>
          {result.correctSentenceJa && <p className="mt-1" lang="ja">{result.correctSentenceJa}</p>}
          <p className="mt-2 leading-6">{result.explanationVi}</p>
        </div>
      )}
    </fieldset>
  );
}
