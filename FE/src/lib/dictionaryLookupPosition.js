const DICTIONARY_LOOKUP_MAX_WIDTH = 18 * 16;
const DICTIONARY_LOOKUP_GUTTER = 16;
const DICTIONARY_LOOKUP_GAP = 8;

export function getDictionaryLookupPosition(
  rect,
  viewportWidth,
  lookupWidth = DICTIONARY_LOOKUP_MAX_WIDTH,
  gutter = DICTIONARY_LOOKUP_GUTTER,
) {
  const availableWidth = Math.max(viewportWidth - (gutter * 2), 0);
  const safeLookupWidth = Math.min(lookupWidth, availableWidth);
  const minCenter = gutter + (safeLookupWidth / 2);
  const maxCenter = viewportWidth - gutter - (safeLookupWidth / 2);
  const preferredCenter = rect.left + (rect.width / 2);

  return {
    left: Math.min(Math.max(preferredCenter, minCenter), maxCenter),
    top: rect.bottom + DICTIONARY_LOOKUP_GAP,
  };
}
