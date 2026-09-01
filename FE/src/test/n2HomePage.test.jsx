import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePage from '@/pages/HomePage';
import { vocabularyApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  vocabularyApi: { getSets: vi.fn() },
}));

const n2Sets = [
  {
    id: 'u4p1', level: 'N2', unitNumber: 4, unitTitle: 'Unit 4', partNumber: 1,
    partTitle: '271–320', rangeStart: 271, rangeEnd: 320, isSummary: false,
  },
  {
    id: 'u4s', level: 'N2', unitNumber: 4, unitTitle: 'Unit 4', partNumber: 3,
    partTitle: 'まとめ1: 371–460', rangeStart: 371, rangeEnd: 460, isSummary: true,
  },
];

describe('N2 home navigation', () => {
  beforeEach(() => {
    vocabularyApi.getSets.mockResolvedValue({ data: n2Sets });
  });

  it('loads the URL-selected level and groups parts under their Unit', async () => {
    render(
      <MemoryRouter initialEntries={['/?level=N2']}>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(vocabularyApi.getSets).toHaveBeenCalledWith('N2'));
    expect(screen.getByRole('tab', { name: 'N2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Unit 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /まとめ1: 371–460/ })).toBeInTheDocument();
  });

  it('defaults to N3 when the URL has no supported level', async () => {
    vocabularyApi.getSets.mockResolvedValue({ data: [] });
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(vocabularyApi.getSets).toHaveBeenCalledWith('N3'));
    expect(screen.getByRole('tab', { name: 'N3' })).toHaveAttribute('aria-selected', 'true');
  });
});
