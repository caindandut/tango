export default function VocabularyExamples({ examples = [] }) {
  const validExamples = Array.isArray(examples)
    ? examples.filter((example) => (
      typeof example?.japanese === 'string'
      && typeof example?.vietnamese === 'string'
      && example.japanese.trim()
      && example.vietnamese.trim()
    ))
    : [];

  return (
    <section
      className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-left shadow-sm sm:p-5"
      aria-label="Ví dụ của từ vựng"
      aria-live="polite"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-800">Ví dụ</h3>
        {validExamples.length > 0 && (
          <span className="text-xs font-medium text-emerald-700">{validExamples.length} câu</span>
        )}
      </div>

      {validExamples.length === 0 ? (
        <p className="text-sm leading-6 text-emerald-900/70">Từ này hiện chưa có ví dụ trong giáo trình.</p>
      ) : (
        <ol className={`space-y-3 ${validExamples.length > 2 ? 'max-h-64 overflow-y-auto pr-1 sm:max-h-72' : ''}`}>
          {validExamples.map((example, index) => (
            <li key={`${example.japanese}-${index}`} className="rounded-xl bg-white/75 p-3 ring-1 ring-emerald-100">
              <p lang="ja" className="font-japanese text-base font-semibold leading-7 text-slate-900 sm:text-lg">
                <span className="mr-2 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 py-0.5 align-middle font-sans text-xs font-bold text-emerald-700">
                  {index + 1}
                </span>
                {example.japanese}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:text-[0.95rem]">{example.vietnamese}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
