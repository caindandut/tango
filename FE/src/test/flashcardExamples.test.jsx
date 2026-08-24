import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FlashcardExamples from '../components/study/FlashcardExamples.jsx';

const examples = [{
  japanese: '毎朝コーヒーを飲みます。',
  vietnamese: 'Tôi uống cà phê mỗi sáng.',
}];

describe('FlashcardExamples', () => {
  it('does not show examples before the card is flipped', () => {
    render(<FlashcardExamples examples={examples} isFlipped={false} />);

    expect(screen.queryByRole('region', { name: 'Ví dụ trong thẻ' })).not.toBeInTheDocument();
  });

  it('shows examples inside the card after it is flipped', () => {
    render(<FlashcardExamples examples={examples} isFlipped />);

    expect(screen.getByRole('region', { name: 'Ví dụ trong thẻ' })).toBeInTheDocument();
    expect(screen.getByText('毎朝コーヒーを飲みます。')).toBeInTheDocument();
    expect(screen.getByText('Tôi uống cà phê mỗi sáng.')).toBeVisible();
    expect(document.querySelector('.vocabulary-examples')).not.toBeInTheDocument();
  });
});