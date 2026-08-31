import JapaneseSegments from '@/components/study/JapaneseSegments';

const validRelationGroups = (relations) => (
  Array.isArray(relations)
    ? relations.filter((group) => (
      typeof group?.label === 'string'
      && group.label.trim()
      && Array.isArray(group.items)
      && group.items.length > 0
    ))
    : []
);

const PLACEHOLDER_PATTERN = /[\uFF3F_]/u;
const EXPLANATORY_PATTERN = /^[\uFF08(].*[\uFF09)]$/u;

function isExplanatoryRelation(japanese) {
  return EXPLANATORY_PATTERN.test(japanese)
    && (japanese.includes('\u4F8B') || japanese.endsWith('\u3002\uFF09'));
}

function splitSegmentsAtTarget(segments, target, targetReading = '') {
  const targetIndex = segments.map((segment) => segment?.text || '').join('').indexOf(target);
  if (targetIndex < 0) return segments;

  let offset = 0;
  return segments.flatMap((segment) => {
    const text = typeof segment?.text === 'string' ? segment.text : '';
    const start = offset;
    const end = offset + text.length;
    offset = end;
    if (!text || end <= targetIndex || start >= targetIndex + target.length) {
      return [{ ...segment, isUnderlined: false }];
    }

    const parts = [];
    const localStart = Math.max(0, targetIndex - start);
    const localEnd = Math.min(text.length, targetIndex + target.length - start);
    if (localStart > 0) parts.push({ text: text.slice(0, localStart), reading: '', isUnderlined: false });
    parts.push({
      text: text.slice(localStart, localEnd),
      reading: targetReading || segment.reading || '',
      isUnderlined: true,
    });
    if (localEnd < text.length) parts.push({ text: text.slice(localEnd), reading: '', isUnderlined: false });
    return parts;
  });
}

function relationSegments(item) {
  const segments = Array.isArray(item?.segments) ? item.segments : [];
  if (segments.length === 0) return segments;
  const japanese = typeof item?.japanese === 'string' ? item.japanese : '';
  const placeholder = japanese.match(PLACEHOLDER_PATTERN)?.[0];
  const explicitTarget = typeof item?.target === 'string' ? item.target.trim() : '';

  // Formula blanks are the only underlined part; the suffix remains plain.
  if (placeholder || explicitTarget) {
    const target = placeholder || explicitTarget;
    const reading = placeholder ? '' : item.reading || '';
    return splitSegmentsAtTarget(segments, target, reading);
  }
  if (segments.some((segment) => segment?.isUnderlined)) return segments;
  if (isExplanatoryRelation(japanese)) return segments;

  // For bracketed notes, underline the lexical term after the usage list.
  const bracketEnd = japanese.lastIndexOf('\u3011');
  const bracketTarget = bracketEnd >= 0 ? japanese.slice(bracketEnd + 1).replace(/^\u306E/u, '') : '';
  if (bracketEnd >= 0 && !bracketTarget) return segments;
  if (bracketTarget) {
    const reading = segments.find((segment) => segment?.reading)?.reading || '';
    return splitSegmentsAtTarget(segments, bracketTarget, reading);
  }

  // Missing flags are transcription omissions: restore the visible lexical item.
  return segments.map((segment) => ({ ...segment, isUnderlined: true }));
}

export default function VocabularyRelations({ relations = [], compact = false }) {
  const groups = validRelationGroups(relations);
  if (groups.length === 0) return null;

  return (
    <span
      className={`vocabulary-relations ${compact ? 'vocabulary-relations--compact' : ''}`}
      role='region'
      aria-label='Các mục liên quan'
    >
      {groups.map((group, groupIndex) => (
        <span className='vocabulary-relations__group' key={`${group.label}-${groupIndex}`}>
          <span className='vocabulary-relations__label'>{group.label}</span>
          <span className='vocabulary-relations__items'>
            {group.items.map((item, itemIndex) => (
              <span className='vocabulary-relations__item' key={`${item.japanese}-${itemIndex}`}>
                <span lang='ja' className='vocabulary-relations__japanese font-japanese'>
                  <JapaneseSegments segments={relationSegments(item)} fallbackText={item.japanese} />
                </span>
                {typeof item.vietnamese === 'string' && item.vietnamese && (
                  <span className='vocabulary-relations__meaning'>{item.vietnamese}</span>
                )}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
