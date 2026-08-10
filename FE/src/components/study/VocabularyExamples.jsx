import { useEffect, useId, useRef, useState } from 'react';
import { dictionaryApi } from '@/lib/api';

const JAPANESE_TERM_PATTERN = /^[\u3041-\u3096\u30a1-\u30fa\u30fc\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3005\u3006\u30f6]+$/u;

export default function VocabularyExamples({ examples = [] }) {
  const [openExamples, setOpenExamples] = useState(() => new Set());
  const [lookup, setLookup] = useState(null);
  const [lookupState, setLookupState] = useState({ status: 'idle', result: null, error: '' });
  const exampleIdPrefix = useId();
  const sectionRef = useRef(null);
  const selectionMadeRef = useRef(false);
  const validExamples = Array.isArray(examples)
    ? examples.filter((example) => (
      typeof example?.japanese === 'string'
      && typeof example?.vietnamese === 'string'
      && example.japanese.trim()
      && example.vietnamese.trim()
    ))
    : [];

  const toggleExample = (index) => {
    if (selectionMadeRef.current) {
      selectionMadeRef.current = false;
      return;
    }
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

  const closeLookup = () => {
    setLookup(null);
    setLookupState({ status: 'idle', result: null, error: '' });
  };

  useEffect(() => {
    if (!lookup) return undefined;

    const dismissLookup = (event) => {
      if (event.key === 'Escape') {
        closeLookup();
      } else if (event.type === 'mousedown' && !sectionRef.current?.contains(event.target)) {
        closeLookup();
      }
    };

    window.addEventListener('keydown', dismissLookup);
    window.addEventListener('mousedown', dismissLookup);
    return () => {
      window.removeEventListener('keydown', dismissLookup);
      window.removeEventListener('mousedown', dismissLookup);
    };
  }, [lookup]);

  const handleSelection = (event, sentence) => {
    const selection = window.getSelection();
    const term = selection?.toString().trim() || '';
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const target = event.currentTarget;
    const selectionIsInsideSentence = range
      && target.contains(range.startContainer)
      && target.contains(range.endContainer);

    if (!selectionIsInsideSentence || !JAPANESE_TERM_PATTERN.test(term)) return;

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;

    selectionMadeRef.current = true;
    setLookup({ term, sentence, left: rect.left + rect.width / 2, top: rect.bottom + 8 });
    setLookupState({ status: 'idle', result: null, error: '' });
  };

  const handleLookup = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!lookup || lookupState.status === 'loading') return;

    setLookupState({ status: 'loading', result: null, error: '' });
    try {
      const response = await dictionaryApi.lookup(lookup.term, lookup.sentence);
      setLookupState({ status: 'success', result: response.data, error: '' });
    } catch (error) {
      setLookupState({
        status: 'error',
        result: null,
        error: error.response?.data?.error?.message || 'Không thể tra cứu lúc này. Hãy thử lại.',
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      className="vocabulary-examples rounded-xl border p-3 text-left shadow-sm sm:rounded-2xl sm:p-4 lg:p-5"
      aria-label="Ví dụ của từ vựng"
      aria-live="polite"
    >
      <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3">
        <h3 className="vocabulary-examples__title text-sm font-bold uppercase tracking-[0.14em]">Ví dụ</h3>
        {validExamples.length > 0 && (
          <span className="vocabulary-examples__count text-xs font-medium">{validExamples.length} câu</span>
        )}
      </div>

      {validExamples.length === 0 ? (
        <p className="vocabulary-examples__empty text-sm leading-6">Từ này hiện chưa có ví dụ trong giáo trình.</p>
      ) : (
        <ol className={`vocabulary-examples__list space-y-2.5 sm:space-y-3 ${validExamples.length > 2 ? 'max-h-72 overflow-y-auto pr-1 sm:max-h-80 lg:max-h-96' : ''}`}>
          {validExamples.map((example, index) => (
            <li key={`${example.japanese}-${index}`} className="vocabulary-examples__item rounded-lg p-2.5 sm:rounded-xl sm:p-3.5">
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
                <span
                  lang="ja"
                  className="vocabulary-examples__japanese min-w-0 flex-1 font-japanese text-lg font-medium leading-7 sm:text-xl"
                  onMouseUp={(event) => handleSelection(event, example.japanese)}
                  onTouchEnd={(event) => handleSelection(event, example.japanese)}
                >
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

      {lookup && (
        <div
          className="dictionary-lookup"
          style={{ left: `${lookup.left}px`, top: `${lookup.top}px` }}
          role="dialog"
          aria-label={`Tra nghĩa ${lookup.term}`}
        >
          {lookupState.status === 'idle' && (
            <button type="button" className="dictionary-lookup__action" onClick={handleLookup}>
              Tra nghĩa “{lookup.term}”
            </button>
          )}
          {lookupState.status === 'loading' && <p className="dictionary-lookup__status" aria-live="polite">Đang tra nghĩa…</p>}
          {lookupState.status === 'success' && (
            <div className="dictionary-lookup__result" aria-live="polite">
              <button type="button" className="dictionary-lookup__close" onClick={closeLookup} aria-label="Đóng tra nghĩa">×</button>
              <p lang="ja" className="dictionary-lookup__term">{lookupState.result.term}</p>
              {lookupState.result.hiragana && <p lang="ja" className="dictionary-lookup__reading">{lookupState.result.hiragana}</p>}
              <p className="dictionary-lookup__meaning">{lookupState.result.meaning}</p>
            </div>
          )}
          {lookupState.status === 'error' && (
            <div className="dictionary-lookup__result" role="alert">
              <button type="button" className="dictionary-lookup__close" onClick={closeLookup} aria-label="Đóng tra nghĩa">×</button>
              <p className="dictionary-lookup__error">{lookupState.error}</p>
              <button type="button" className="dictionary-lookup__retry" onClick={handleLookup}>Thử lại</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
