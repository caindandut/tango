const MIN_GRAMMAR_LENGTH = 2;
const SINGLE_CHARACTER_GRAMMARS = new Set(['と', 'に', 'の', 'で', 'は', 'も', 'が', 'を', 'へ', 'さ', 'み']);

function getLiteralChunks(structure) {
  return structure
    .replace(/〈[^〉]*〉/g, '')
    .replace(/\([^)]*\)/g, '')
    .match(/[ぁ-んァ-ヶ一-龯々ー]+/g) || [];
}

function getCandidateVariants(chunk) {
  const variants = new Set([chunk]);
  for (let start = 0; start < chunk.length; start += 1) {
    for (let end = start + MIN_GRAMMAR_LENGTH; end <= chunk.length; end += 1) {
      variants.add(chunk.slice(start, end));
    }
  }
  return [...variants].filter((variant) => (
    variant.length >= MIN_GRAMMAR_LENGTH || SINGLE_CHARACTER_GRAMMARS.has(variant)
  ));
}

function getStructuralCandidates(structures = []) {
  return structures
    .flatMap(getLiteralChunks)
    .flatMap(getCandidateVariants)
    .sort((left, right) => right.length - left.length);
}

function getMatches(title, candidates) {
  return candidates.flatMap((candidate) => {
    const matches = [];
    let start = title.indexOf(candidate);
    while (start >= 0) {
      matches.push({ start, end: start + candidate.length });
      start = title.indexOf(candidate, start + 1);
    }
    return matches;
  });
}

function selectNonOverlappingMatches(matches) {
  const selected = matches
    .sort((left, right) => (right.end - right.start) - (left.end - left.start) || left.start - right.start)
    .filter((match, index, allMatches) => allMatches.slice(0, index).every((selected) => (
      match.end <= selected.start || match.start >= selected.end
    )))
    .sort((left, right) => left.start - right.start);

  return selected.reduce((merged, match) => {
    const previous = merged.at(-1);
    if (previous && match.start <= previous.end) {
      previous.end = Math.max(previous.end, match.end);
      return merged;
    }
    return [...merged, { ...match }];
  }, []);
}

function getExampleFallbackMatches(title, examples = []) {
  for (const example of examples) {
    for (const segment of example.segments || []) {
      if (!segment.isGrammar) continue;
      const candidate = segment.text.replace(/[\s。、！？「」『』…]/g, '');
      for (let length = candidate.length; length >= MIN_GRAMMAR_LENGTH; length -= 1) {
        const shortened = candidate.slice(0, length);
        const start = title.indexOf(shortened);
        if (start >= 0) return [{ start, end: start + shortened.length }];
      }
    }
  }
  return [];
}

function getGrammarTitleMatches(point) {
  const structuralMatches = selectNonOverlappingMatches(
    getMatches(point.titleJa, getStructuralCandidates(point.structures)),
  );
  return structuralMatches.length > 0
    ? structuralMatches
    : getExampleFallbackMatches(point.titleJa, point.examples);
}

export default function GrammarTitle({ point }) {
  const matches = getGrammarTitleMatches(point);
  const parts = [];
  let cursor = 0;

  matches.forEach(({ start, end }) => {
    if (start > cursor) parts.push({ text: point.titleJa.slice(cursor, start), underlined: false });
    parts.push({ text: point.titleJa.slice(start, end), underlined: true });
    cursor = end;
  });
  if (cursor < point.titleJa.length) parts.push({ text: point.titleJa.slice(cursor), underlined: false });
  if (parts.length === 0) parts.push({ text: point.titleJa, underlined: false });

  return parts.map((part, index) => (
    <span key={`${part.text}-${index}`} className={part.underlined ? 'grammar-underline' : undefined}>
      {part.text}
    </span>
  ));
}
