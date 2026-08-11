import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GrammarLessonView from '@/components/grammar/GrammarLessonView';
import GrammarReviewView from '@/components/grammar/GrammarReviewView';
import TextSegments from '@/components/grammar/TextSegments';
import { grammarApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  grammarApi: {
    checkQuestion: vi.fn(),
    gradeReview: vi.fn(),
  },
}));

const day = {
  id: 'w1d1', weekNumber: 1, dayNumber: 1, kind: 'LESSON',
  grammarPoints: [{
    id: 'g1', titleJa: '書かれている', meaningVi: 'Thể bị động.', structures: ['Vられる'], usageVi: 'Dùng để nêu sự việc.',
    examples: [{ id: 'e1', segments: [{ text: '世界で', isGrammar: false }, { text: '言われています', isGrammar: true }], translationVi: 'Được nói đến trên thế giới.' }],
  }],
  questions: [{
    id: 'w1d1-q1', type: 'BINARY_CHOICE',
    promptSegments: [{ text: '英語は', isGrammar: false }, { text: '。', isGrammar: false }],
    options: [{ id: 'A', text: '話されて' }, { id: 'B', text: '話られて' }],
  }],
};

describe('grammar components', () => {
  beforeEach(() => {
    window.localStorage.clear();
    grammarApi.checkQuestion.mockResolvedValue({ data: {
      questionId: 'w1d1-q1', selectedOptionId: 'A', correctOptionId: 'A', isCorrect: true, explanationVi: 'Đúng.',
    } });
    grammarApi.gradeReview.mockResolvedValue({ data: {
      score: 100, maxScore: 100, correctCount: 25, totalQuestions: 25,
      results: Array.from({ length: 25 }, (_, index) => ({ questionId: `w1d7-q${index + 1}`, selectedOptionId: 'A', correctOptionId: 'A', isCorrect: true, explanationVi: 'Đúng.' })),
    } });
  });
  afterEach(() => vi.clearAllMocks());

  it('renders safe underlined segments and toggles example translations', () => {
    const { container } = render(<><TextSegments segments={day.grammarPoints[0].examples[0].segments} /><GrammarLessonView day={day} /></>);
    expect(container.querySelector('.grammar-underline')).toHaveTextContent('言われています');
    expect(screen.queryByText('Được nói đến trên thế giới.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Hiện nghĩa ví dụ/i));
    expect(screen.getAllByText('Được nói đến trên thế giới.').length).toBeGreaterThan(0);
  });

  it('locks the answer after checking and remembers it locally', async () => {
    render(<GrammarLessonView day={day} />);
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu luyện tập/i }));
    fireEvent.click(screen.getByLabelText(/A\.\s*話されて/i));
    fireEvent.click(screen.getByRole('button', { name: /Chấm câu/i }));
    await waitFor(() => expect(screen.getByText('✓ Chính xác')).toBeInTheDocument());
    expect(screen.getByRole('radio', { name: /A\.\s*話されて/i })).toBeDisabled();
    expect(JSON.parse(window.localStorage.getItem('tango.grammarProgress.v1')).days.w1d1.dailyResults['w1d1-q1'].isCorrect).toBe(true);
  });

  it('submits a review early and reveals the score only after grading', async () => {
    const reviewDay = {
      id: 'w1d7', weekNumber: 1, dayNumber: 7, kind: 'REVIEW', timeLimitSeconds: 900,
      questions: Array.from({ length: 25 }, (_, index) => ({
        id: `w1d7-q${index + 1}`, type: 'REVIEW_CHOICE',
        promptSegments: [{ text: `Câu ${index + 1}`, isGrammar: false }],
        options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }, { id: 'C', text: 'C' }, { id: 'D', text: 'D' }],
      })),
    };
    render(<GrammarReviewView day={reviewDay} />);
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu tính giờ/i }));
    fireEvent.click(screen.getByRole('button', { name: /Nộp bài/i }));
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
    expect(grammarApi.gradeReview).toHaveBeenCalledWith(1, []);
    expect(screen.getByText(/Đúng 25\/25 câu/i)).toBeInTheDocument();
  });
});
