import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JapaneseSegments from '@/components/study/JapaneseSegments';
import VocabularyRelations from '@/components/study/VocabularyRelations';
import FlashcardExamples from '@/components/study/FlashcardExamples';

const segments = [
  { text: '人生', reading: 'じんせい', isUnderlined: true },
  { text: 'を', reading: '', isUnderlined: false },
  { text: '送る', reading: 'おくる', isUnderlined: false },
];

const relations = [{
  label: '連',
  items: [{
    japanese: '＿を送る',
    vietnamese: 'Sống một cuộc sống',
    segments: [
      { text: '＿を', reading: '', isUnderlined: true },
      { text: '送る', reading: 'おくる', isUnderlined: false },
    ],
  }],
}];

describe('N2 structured vocabulary rendering', () => {
  it('renders ruby, source underline and the literal blank safely', () => {
    const { container } = render(<JapaneseSegments segments={segments} />);

    expect(container.querySelector('ruby')).toBeInTheDocument();
    expect(container.querySelector('rt')).toHaveTextContent('じんせい');
    expect(container.querySelector('u')).toHaveTextContent('人生');
    expect(container.querySelector('[dangerouslySetInnerHTML]')).not.toBeInTheDocument();
  });

  it('repairs a whole-sentence underline using the active vocabulary term', () => {
    const { container } = render(
      <JapaneseSegments
        segments={[{ text: '幸せな人生を送る。', reading: 'しあわせなじんせいをおくる。', isUnderlined: true }]}
        targetText='人生'
        targetReading='じんせい'
      />,
    );

    expect(container.querySelector('u')).toHaveTextContent('人生');
    expect(container.querySelector('u')).not.toHaveTextContent('幸せな');
  });

  it('places furigana only above Kanji in a mixed phrase', () => {
    const { container } = render(
      <JapaneseSegments
        segments={[{ text: '人間ができている', reading: 'にんげんができている', isUnderlined: true }]}
      />,
    );

    expect(container.querySelector('ruby')).toHaveTextContent('人間');
    expect(container.querySelector('ruby')).not.toHaveTextContent('ができている');
    expect(container.querySelector('rt')).toHaveTextContent('にんげん');
  });

  it('renders every relation label, literal blank and exact Vietnamese text', () => {
    render(<VocabularyRelations relations={relations} />);

    expect(screen.getByText('連')).toBeInTheDocument();
    expect(screen.getByText('Sống một cuộc sống')).toBeInTheDocument();
    expect(screen.getByText(/＿/)).toBeInTheDocument();
  });

  it('keeps N3 string examples as a fallback', () => {
    render(<JapaneseSegments fallbackText='毎朝コーヒーを飲みます。' />);
    expect(screen.getByText('毎朝コーヒーを飲みます。')).toBeInTheDocument();
  });

  it('shows N2 relations only after a flashcard is flipped', () => {
    const { rerender } = render(
      <FlashcardExamples examples={[]} relations={relations} isFlipped={false} />,
    );
    expect(screen.queryByText('Sống một cuộc sống')).not.toBeInTheDocument();

    rerender(<FlashcardExamples examples={[]} relations={relations} isFlipped />);
    expect(screen.getByText('Sống một cuộc sống')).toBeInTheDocument();
  });
});
