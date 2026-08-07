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
      className="vocabulary-examples rounded-2xl border p-4 text-left shadow-sm sm:p-5"
      aria-label="Ví dụ của từ vựng"
      aria-live="polite"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="vocabulary-examples__title text-sm font-bold uppercase tracking-[0.14em]">Ví dụ</h3>
        {validExamples.length > 0 && (
          <span className="vocabulary-examples__count text-xs font-medium">{validExamples.length} câu</span>
        )}
      </div>

      {validExamples.length === 0 ? (
        <p className="vocabulary-examples__empty text-sm leading-6">Từ này hiện chưa có ví dụ trong giáo trình.</p>
      ) : (
        <ol className={`space-y-3 ${validExamples.length > 2 ? 'max-h-64 overflow-y-auto pr-1 sm:max-h-72' : ''}`}>
          {validExamples.map((example, index) => (
            <li key={`${example.japanese}-${index}`} className="vocabulary-examples__item rounded-xl p-3 sm:p-3.5">
              <p lang="ja" className="vocabulary-examples__japanese font-japanese text-base font-semibold leading-7 sm:text-lg">
                <span className="vocabulary-examples__index mr-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 align-middle font-sans text-xs font-bold">
                  {index + 1}
                </span>
                {example.japanese}
              </p>
              <p className="vocabulary-examples__translation mt-1.5 text-sm leading-6 sm:text-[0.95rem]">{example.vietnamese}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
