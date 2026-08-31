const KANJI_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

export default function JapaneseSegments({ segments, fallbackText = '' }) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return fallbackText;
  }

  return segments.map((segment, index) => {
    const text = typeof segment?.text === 'string' ? segment.text : '';
    const reading = typeof segment?.reading === 'string' ? segment.reading : '';
    const content = segment?.isUnderlined ? <u>{text}</u> : text;
    const key = `${text}-${reading}-${index}`;

    if (reading && KANJI_PATTERN.test(text)) {
      return (
        <ruby key={key} className='japanese-ruby'>
          {content}
          <rt className='japanese-ruby__reading'>{reading}</rt>
        </ruby>
      );
    }

    return <span key={key}>{content}</span>;
  });
}
