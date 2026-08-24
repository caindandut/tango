import VocabularyExamples from './VocabularyExamples.jsx';

export default function FlashcardExamples({ examples = [], isFlipped }) {
  if (!isFlipped) return null;

  return (
    <div className="mt-4 animate-fade-in">
      <VocabularyExamples examples={examples} />
    </div>
  );
}
