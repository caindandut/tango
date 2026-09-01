import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '@/pages/HomePage';
import GrammarLayout from '@/components/grammar/GrammarLayout';

vi.mock('@/lib/api', () => ({
  vocabularyApi: {
    getSets: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('learning navigation visibility', () => {
  it('hides the grammar tab on the vocabulary home page', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: /khu/i });
    expect(navigation.querySelectorAll('button')).toHaveLength(0);
  });

  it('hides the grammar tab inside the grammar layout as well', () => {
    render(
      <MemoryRouter initialEntries={['/grammar']}>
        <GrammarLayout> Nội dung </GrammarLayout>
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('navigation', { name: /khu/i });
    expect(navigation.querySelectorAll('a')).toHaveLength(1);
  });
});
