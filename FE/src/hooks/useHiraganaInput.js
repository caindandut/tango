import { useRef, useEffect, useCallback } from 'react';
import * as wanakana from 'wanakana';

/**
 * Custom hook to bind WanaKana to an input element
 * Automatically converts romaji to hiragana as user types
 */
export function useHiraganaInput(inputRef, options = {}) {
  const boundRef = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    if (el && !boundRef.current) {
      wanakana.bind(el, {
        IMEMode: 'toHiragana',
        ...options,
      });
      boundRef.current = true;
    }

    return () => {
      if (el && boundRef.current) {
        wanakana.unbind(el);
        boundRef.current = false;
      }
    };
  }, [inputRef, options]);

  const getHiraganaValue = useCallback((value) => {
    return wanakana.toHiragana(value);
  }, []);

  const isHiragana = useCallback((value) => {
    return wanakana.isHiragana(value);
  }, []);

  return { getHiraganaValue, isHiragana };
}

export default useHiraganaInput;
