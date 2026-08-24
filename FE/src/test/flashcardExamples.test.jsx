import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FlashcardExamples from '../components/study/FlashcardExamples.jsx';

const examples = [{
  japanese: '毎朝コーヒーを飲みます。',
  vietnamese: 'Tôi uống cà phê mỗi sáng.',
}];

describe('FlashcardExamples', () => {
  it('does not show examples before the card is flipped', () => {
    render(<FlashcardExamples examples={examples} isFlipped={false} />);

    expect(screen.queryByRole('region', { name: 'Ví dụ của từ vựng' })).not.toBeInTheDocument();
  });

  it('shows vocabulary examples after the card is flipped', () => {
    render(<FlashcardExamples examples={examples} isFlipped />);

    expect(screen.getByRole('region', { name: 'Ví dụ của từ vựng' })).toBeInTheDocument();
    expect(screen.getByText('毎朝コーヒーを飲みます。')).toBeInTheDocument();
    fireEvent.click(screen.getByText('毎朝コーヒーを飲みます。'))
    expect(screen.getByText('Tôi uống cà phê mỗi sáng.')).toBeVisible()
  });
});
