import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import KanjiWritingPad from '@/components/study/KanjiWritingPad';

const currentWord = {
  id: 'word-1',
  kanji: '図書館',
  hiragana: 'としょかん',
  meaning: 'Thư viện',
};

function setViewport(isMobile) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: isMobile && query === '(max-width: 640px)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

function mockCanvas() {
  const context = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  };

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: 320,
    height: 320,
    left: 0,
    right: 320,
    top: 0,
    width: 320,
  });
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });

  return context;
}

describe('KanjiWritingPad', () => {
  let context;

  beforeEach(() => {
    setViewport(false);
    context = mockCanvas();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the trigger for a vocabulary item that contains Kanji', () => {
    render(<KanjiWritingPad currentWord={currentWord} />);

    expect(screen.getByRole('button', { name: /mở bảng luyện viết kanji/i })).toBeInTheDocument();
  });

  it('does not show a writing trigger for Kana-only vocabulary', () => {
    render(<KanjiWritingPad currentWord={{ ...currentWord, kanji: 'としょかん' }} />);

    expect(screen.queryByRole('button', { name: /mở bảng luyện viết kanji/i })).not.toBeInTheDocument();
  });

  it('opens the writing panel with the current vocabulary sample', () => {
    render(<KanjiWritingPad currentWord={currentWord} />);

    fireEvent.click(screen.getByRole('button', { name: /mở bảng luyện viết kanji/i }));

    const panel = screen.getByRole('dialog', { name: /luyện viết kanji/i });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText('図書館')).toBeInTheDocument();
    expect(within(panel).getByText('としょかん')).toBeInTheDocument();
    expect(within(panel).getByText('Thư viện')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: /xóa nét vẽ/i })).toBeInTheDocument();
  });

  it('draws pointer strokes and clears them from the canvas', () => {
    render(<KanjiWritingPad currentWord={currentWord} />);
    fireEvent.click(screen.getByRole('button', { name: /mở bảng luyện viết kanji/i }));

    const canvas = screen.getByRole('img', { name: /vùng vẽ luyện viết kanji/i });
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 30, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 90, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 80, clientY: 90, pointerId: 1 });

    expect(context.beginPath).toHaveBeenCalled();
    expect(context.moveTo).toHaveBeenCalledWith(20, 30);
    expect(context.lineTo).toHaveBeenCalledWith(80, 90);
    expect(context.stroke).toHaveBeenCalled();

    const clearCallsBeforeClick = context.clearRect.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /xóa nét vẽ/i }));
    expect(context.clearRect.mock.calls.length).toBeGreaterThan(clearCallsBeforeClick);
  });

  it('closes the desktop side panel with Escape without rendering a backdrop', () => {
    render(<KanjiWritingPad currentWord={currentWord} />);
    fireEvent.click(screen.getByRole('button', { name: /mở bảng luyện viết kanji/i }));

    expect(screen.queryByTestId('kanji-writing-pad-backdrop')).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /luyện viết kanji/i })).not.toBeInTheDocument();
  });

  it('uses a modal backdrop on mobile and closes when the backdrop is clicked', () => {
    setViewport(true);
    render(<KanjiWritingPad currentWord={currentWord} />);
    fireEvent.click(screen.getByRole('button', { name: /mở bảng luyện viết kanji/i }));

    expect(screen.getByTestId('kanji-writing-pad-backdrop')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /luyện viết kanji/i })).toHaveAttribute('aria-modal', 'true');

    fireEvent.pointerDown(screen.getByTestId('kanji-writing-pad-backdrop'));
    expect(screen.queryByRole('dialog', { name: /luyện viết kanji/i })).not.toBeInTheDocument();
  });
});
