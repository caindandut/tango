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

  it('renders a relation blank as one source glyph without a duplicate HTML underline', () => {
    const { container } = render(
      <JapaneseSegments
        segments={[{ text: '＿', reading: '', isUnderlined: true }]}
      />,
    );

    expect(container.textContent).toBe('＿');
    expect(container.querySelectorAll('u')).toHaveLength(0);
  });

  it('matches the verified relation row without an extra placeholder', () => {
    const { container } = render(
      <VocabularyRelations
        relations={[{
          label: '類',
          items: [
            { japanese: '一生', vietnamese: 'Cuộc đời', segments: [{ text: '一生', reading: 'いっしょう', isUnderlined: false }] },
            { japanese: '生涯', vietnamese: 'Cả đời người, sinh thời', segments: [{ text: '生涯', reading: 'しょうがい', isUnderlined: false }] },
          ],
        }]}
      />,
    );

    expect(container.textContent).toContain('一生');
    expect(container.textContent).not.toContain('＿一生');
    expect(container.textContent).toContain('生涯');
    expect(container.querySelectorAll('u')).toHaveLength(0);
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

  it('renders every relation label and the literal blank safely', () => {
    render(<VocabularyRelations relations={relations} />);

    expect(screen.getByText('連')).toBeInTheDocument();
    expect(screen.getByText('Sống một cuộc sống')).toBeInTheDocument();
    expect(screen.getByText(/＿/)).toBeInTheDocument();
  });

  it('does not underline bold relation terms as if they were source underlines', () => {
    const { container } = render(
      <VocabularyRelations
        relations={[{
          label: '関',
          items: [
            {
              japanese: '原料',
              vietnamese: 'Nguyên liệu',
              segments: [{ text: '原料', reading: 'げんりょう', isUnderlined: true }],
            },
            {
              japanese: '素材',
              vietnamese: 'Chất liệu',
              segments: [{ text: '素材', reading: 'そざい', isUnderlined: true }],
            },
          ],
        }, {
          label: '合',
          items: [
            {
              japanese: '判断',
              vietnamese: 'Dữ liệu đánh giá',
              segments: [{ text: '判断', reading: 'はんだん', isUnderlined: true }],
            },
            {
              japanese: '不安',
              vietnamese: 'Lý do bất an',
              segments: [{ text: '不安', reading: 'ふあん', isUnderlined: true }],
            },
          ],
        }]}
      />,
    );

    expect(container.querySelectorAll('u')).toHaveLength(0);
  });

  it('underlines only explicit targets and literal blanks', () => {
    const { container } = render(
      <VocabularyRelations
        relations={[{
          label: 'relation',
          items: [
            {
              japanese: '＿がいい',
              vietnamese: 'Tâm trạng tốt',
              segments: [{ text: '＿がいい', reading: 'きげん', isUnderlined: false }],
            },
            {
              japanese: '当てはめる',
              vietnamese: 'Áp dụng',
              target: 'はめる',
              reading: 'はめる',
              segments: [{ text: '当てはめる', reading: 'はめる', isUnderlined: false }],
            },
            {
              japanese: '（名）占い',
              vietnamese: 'Bói',
              segments: [{ text: '（名）占い', reading: 'うらない', isUnderlined: true }],
            },
          ],
        }]}
      />,
    );

    const underlined = [...container.querySelectorAll('u')].map((node) => node.textContent);
    expect(container.textContent).toContain('＿');
    expect(underlined).toContain('はめる');
    expect(underlined).not.toContain('当てはめる');
    expect(underlined).not.toContain('（名）占い');
  });

  it('renders the corrected まいあがる example with per-kanji furigana', () => {
    const { container } = render(
      <JapaneseSegments
        segments={[
          { text: '女の子から', reading: 'おんなのこから', isUnderlined: false },
          { text: '告白', reading: 'こくはく', isUnderlined: false },
          { text: 'されて、', reading: '', isUnderlined: false },
          { text: '彼', reading: 'かれ', isUnderlined: false },
          { text: 'は', reading: '', isUnderlined: false },
          { text: '舞い上がった', reading: 'まいあがった', isUnderlined: true },
          { text: '。', reading: '', isUnderlined: false },
        ]}
      />,
    );

    expect(container.textContent).toContain('女おんなの子こから告白こくはくされて、彼かれは舞まい上あがった。');
    expect(container.querySelectorAll('rt')).toHaveLength(6);
    expect(container.querySelector('u')).toHaveTextContent('舞まい上あがった');
    expect(container.querySelector('u')).not.toHaveTextContent('彼は');
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
