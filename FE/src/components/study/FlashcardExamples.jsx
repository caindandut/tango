const isValidExample = (example) => (
  typeof example?.japanese === 'string'
  && typeof example?.vietnamese === 'string'
  && example.japanese.trim()
  && example.vietnamese.trim()
);

export default function FlashcardExamples({ examples = [], isFlipped }) {
  if (!isFlipped) return null;

  const validExamples = Array.isArray(examples) ? examples.filter(isValidExample) : [];
  if (validExamples.length === 0) return null;

  return (
    <span
      className="flashcard-examples mt-4 block w-full max-w-2xl border-t border-slate-700 pt-3 text-left"
      role="region"
      aria-label="Ví dụ trong thẻ"
    >
      <span className="mb-2 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">
        <span>Ví dụ</span>
        <span>{validExamples.length} câu</span>
      </span>
      <span className="block max-h-24 space-y-2 overflow-y-auto pr-1 sm:max-h-28">
        {validExamples.map((example, index) => (
          <span key={example.japanese + index} className="block border-l-2 border-emerald-400/60 pl-3">
            <span lang="ja" className="block font-japanese text-sm font-medium leading-6 text-slate-100">
              {example.japanese}
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-300">
              {example.vietnamese}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}