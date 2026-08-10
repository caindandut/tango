import { forwardRef, useEffect, useRef } from 'react';
import * as wanakana from 'wanakana';

const HiraganaInput = forwardRef(({ value, onChange, onKeyDown, onFocus, onBlur, placeholder, disabled, kanaMode = 'toHiragana' }, ref) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;
  const boundRef = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    if (!boundRef.current) {
      wanakana.bind(el, { IMEMode: kanaMode });
      boundRef.current = true;
    }

    // Listen for input events from WanaKana
    const handleInput = (e) => {
      onChange(e.target.value);
    };

    el.addEventListener('input', handleInput);

    return () => {
      el.removeEventListener('input', handleInput);
      if (boundRef.current) {
        try {
          wanakana.unbind(el);
        } catch {
          // ignore unbind errors
        }
        boundRef.current = false;
      }
    };
  }, [inputRef, onChange, kanaMode]);

  // Sync external value to input
  useEffect(() => {
    const el = inputRef.current;
    if (el && el.value !== value) {
      el.value = value;
    }
  }, [value, inputRef]);

  return (
    <input
      ref={inputRef}
      type="text"
      lang="ja"
      className="romaji-input"
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
    />
  );
});

HiraganaInput.displayName = 'HiraganaInput';

export default HiraganaInput;
