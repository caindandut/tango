import JapaneseSegments from '@/components/study/JapaneseSegments';
import VocabularyRelations from '@/components/study/VocabularyRelations';

const isValidExample = (example) => (
  typeof example?.japanese === 'string'
  && typeof example?.vietnamese === 'string'
  && example.japanese.trim()
  && example.vietnamese.trim()
);

export default function FlashcardExamples({ examples = [], relations = [], isFlipped }) {
  if (!isFlipped) return null;

  const validExamples = Array.isArray(examples) ? examples.filter(isValidExample) : [];
  const hasRelations = Array.isArray(relations) && relations.some((group) => group?.items?.length);
  if (validExamples.length === 0 && !hasRelations) return null;

  return (
    <span
      className='flashcard-examples mt-4 block w-full max-w-2xl border-t border-slate-700 pt-3 text-left'
      role='region'
      aria-label='Ví dụ trong thẻ'
    >
      {validExamples.length > 0 && (
        <>
          <span className='mb-2 flex items-center justify-between gap-2 text-sm font-bold uppercase tracking-[0.14em] text-emerald-300 sm:text-base'>
            <span>Ví dụ</span>
            <span>{validExamples.length} câu</span>
          </span>
          <span className='block space-y-2'>
            {validExamples.map((example, index) => (
              <span key={example.japanese + index} className='block border-l-2 border-emerald-400/60 pl-3'>
                <span lang='ja' className='block font-japanese text-base font-medium leading-7 text-slate-100 sm:text-lg text-xl sm:text-2xl'>
                  <JapaneseSegments segments={example.segments} fallbackText={example.japanese} />
                </span>
                <span className='mt-1 block text-sm leading-6 text-slate-300 sm:text-base text-base sm:text-lg sm:leading-8'>
                  {example.vietnamese}
                </span>
              </span>
            ))}
          </span>
        </>
      )}
      <VocabularyRelations relations={relations} compact />
    </span>
  );
}
