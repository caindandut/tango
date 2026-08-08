import { useId, useState } from 'react';

export default function VocabularyExamples({ examples = [] }) {
  const [openExamples, setOpenExamples] = useState(() => new Set());
  const exampleIdPrefix = useId();
  const validExamples = Array.isArray(examples)
    ? examples.filter((example) => (
      typeof example?.japanese === 'string'
      && typeof example?.vietnamese === 'string'
      && example.japanese.trim()
      && example.vietnamese.trim()
    ))
    : [];

  const toggleExample = (index) => {
    setOpenExamples((currentOpenExamples) => {
      const nextOpenExamples = new Set(currentOpenExamples);

      if (nextOpenExamples.has(index)) {
        nextOpenExamples.delete(index);
      } else {
        nextOpenExamples.add(index);
      }

      return nextOpenExamples;
    });
  };

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
              <button
                type="button"
                className="vocabulary-examples__trigger"
                aria-expanded={openExamples.has(index)}
                aria-controls={`${exampleIdPrefix}-meaning-${index}`}
                onClick={() => toggleExample(index)}
              >
                <span className="vocabulary-examples__index inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 font-sans text-xs font-bold">
                  {index + 1}
                </span>
                <span lang="ja" className="vocabulary-examples__japanese font-japanese text-lg font-medium leading-7 sm:text-xl">
                  {example.japanese}
                </span>
                <span className="vocabulary-examples__chevron" aria-hidden="true">
                  {openExamples.has(index) ? '⌃' : '⌄'}
                </span>
              </button>
              {openExamples.has(index) && (
                <p id={`${exampleIdPrefix}-meaning-${index}`} className="vocabulary-examples__translation mt-1.5 text-sm leading-6 sm:text-[0.95rem]">
                  {example.vietnamese}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
