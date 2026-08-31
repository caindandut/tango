import { Fragment } from 'react';

const KANJI_CHAR_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;
const KANJI_ONLY_PATTERN = /^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+$/u;
const KANA_PATTERN = /[\u3040-\u30ff]/u;

function normalizeKana(value) {
  return value.replace(/[\u30a1-\u30f6]/gu, (character) => (
    String.fromCharCode(character.charCodeAt(0) - 0x60)
  ));
}

function splitRuns(text) {
  const runs = [];
  for (const character of Array.from(text)) {
    const isKanji = KANJI_CHAR_PATTERN.test(character);
    const previous = runs[runs.length - 1];
    if (previous && previous.isKanji === isKanji) {
      previous.text += character;
    } else {
      runs.push({ text: character, isKanji });
    }
  }
  return runs;
}

function decorate(text, isUnderlined) {
  // A relation blank is a literal full-width underscore from the source.
  // It already contains its own horizontal stroke, so wrapping it in <u>
  // would render a duplicate underline in the study card.
  if (isUnderlined && !/^[＿_]+$/u.test(text)) return <u>{text}</u>;
  return text;
}

function renderWithRuby(text, reading, isUnderlined, key) {
  if (!reading || !KANJI_CHAR_PATTERN.test(text)) {
    return <span key={key}>{decorate(text, isUnderlined)}</span>;
  }

  if (KANJI_ONLY_PATTERN.test(text)) {
    return (
      <ruby key={key} className='japanese-ruby'>
        {decorate(text, isUnderlined)}
        <rt className='japanese-ruby__reading'>{reading}</rt>
      </ruby>
    );
  }

  const runs = splitRuns(text);
  const normalizedReading = normalizeKana(reading);
  let readingCursor = 0;

  const renderedRuns = runs.map((run, runIndex) => {
        if (!run.isKanji) {
          const normalizedRun = normalizeKana(run.text);
          if (KANA_PATTERN.test(run.text)) {
            const markerIndex = normalizedReading.indexOf(normalizedRun, readingCursor);
            if (markerIndex >= readingCursor) readingCursor = markerIndex + normalizedRun.length;
          }
          return <Fragment key={`${key}-plain-${runIndex}`}>{run.text}</Fragment>;
        }

        const nextKanaRun = runs.slice(runIndex + 1).find((candidate) => (
          !candidate.isKanji && KANA_PATTERN.test(candidate.text)
        ));
        const nextMarker = nextKanaRun ? normalizeKana(nextKanaRun.text) : '';
        const markerIndex = nextMarker
          ? normalizedReading.indexOf(nextMarker, readingCursor)
          : -1;
        const readingEnd = markerIndex >= readingCursor ? markerIndex : normalizedReading.length;
        const rubyReading = reading.slice(readingCursor, readingEnd);
        readingCursor = readingEnd;

        if (!rubyReading) return <Fragment key={`${key}-kanji-${runIndex}`}>{run.text}</Fragment>;

        return (
          <ruby key={`${key}-kanji-${runIndex}`} className='japanese-ruby'>
            {run.text}
            <rt className='japanese-ruby__reading'>{rubyReading}</rt>
          </ruby>
        );
      });

  return isUnderlined
    ? <u key={key}>{renderedRuns}</u>
    : <Fragment key={key}>{renderedRuns}</Fragment>;
}

function findTarget(fullText, targetText, targetReading) {
  const candidates = String(targetText || '')
    .split(/[/／]/u)
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  for (const candidate of candidates) {
    const index = fullText.indexOf(candidate);
    if (index >= 0) return { index, text: candidate, reading: targetReading || '' };
  }

  const reading = String(targetReading || '').trim();
  if (reading) {
    const index = fullText.indexOf(reading);
    if (index >= 0) return { index, text: reading, reading };
  }

  return null;
}

function repairWholeSentenceUnderline(segments, targetText, targetReading) {
  if (!Array.isArray(segments) || segments.length === 0 || !targetText) return segments;
  const fullText = segments.map((segment) => segment?.text || '').join('');
  const wholeSentenceUnderline = segments.length === 1
    && segments[0]?.isUnderlined
    && segments[0]?.text === fullText;
  if (!wholeSentenceUnderline) return segments;

  const target = findTarget(fullText, targetText, targetReading);
  if (!target) return segments.map((segment) => ({ ...segment, isUnderlined: false }));

  return [
    { text: fullText.slice(0, target.index), reading: '', isUnderlined: false },
    { text: target.text, reading: target.reading, isUnderlined: true },
    { text: fullText.slice(target.index + target.text.length), reading: '', isUnderlined: false },
  ].filter((segment) => segment.text);
}

export default function JapaneseSegments({
  segments,
  fallbackText = '',
  targetText = '',
  targetReading = '',
}) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return fallbackText;
  }

  const renderSegments = repairWholeSentenceUnderline(segments, targetText, targetReading);
  return renderSegments.map((segment, index) => {
    const text = typeof segment?.text === 'string' ? segment.text : '';
    const reading = typeof segment?.reading === 'string' ? segment.reading : '';
    return renderWithRuby(text, reading, segment?.isUnderlined === true, `${text}-${reading}-${index}`);
  });
}
