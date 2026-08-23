import { describe, expect, it } from 'vitest';
import { getDictionaryLookupPosition } from '../lib/dictionaryLookupPosition.js';

describe('dictionary lookup positioning', () => {
  it('keeps the popup inside a narrow viewport when the selected text is near the left edge', () => {
    expect(getDictionaryLookupPosition({ left: 4, width: 20, bottom: 100 }, 320)).toEqual({
      left: 160,
      top: 108,
    });
  });

  it('keeps the popup inside a narrow viewport when the selected text is near the right edge', () => {
    expect(getDictionaryLookupPosition({ left: 296, width: 20, bottom: 100 }, 320)).toEqual({
      left: 160,
      top: 108,
    });
  });

  it('keeps the popup centered when there is enough space around the selected text', () => {
    expect(getDictionaryLookupPosition({ left: 374, width: 20, bottom: 100 }, 768)).toEqual({
      left: 384,
      top: 108,
    });
  });
});
