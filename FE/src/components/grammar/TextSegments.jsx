export default function TextSegments({ segments = [], className = '' }) {
  return (
    <span className={className}>
      {segments.map((segment, index) => (
        <span key={`${segment.text}-${index}`} className={segment.isGrammar ? 'grammar-underline' : undefined}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}
