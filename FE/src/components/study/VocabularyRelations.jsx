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
                  <JapaneseSegments segments={item.segments} fallbackText={item.japanese} />
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
