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

  it('renders grammar structures as textbook-style rows', () => {
    render(<GrammarLessonView day={{ ...day, grammarPoints: [{
      ...day.grammarPoints[0],
      structures: ['Nとして', 'としては', 'としても', 'としてのN'],
    }] }} />);

    const structureLabel = screen.getByText('Cấu trúc');
    const structureList = structureLabel.nextElementSibling;
    const structureRow = screen.getByText('としてのN').closest('li');

    expect(structureList).toHaveClass('grammar-structures');
    expect(structureRow).toHaveClass('grammar-structure-row');
    expect(structureRow).not.toHaveClass('rounded-lg');
  });

  it('groups alternate grammar forms inside textbook square brackets', () => {
    render(<GrammarLessonView day={{ ...day, grammarPoints: [{
      ...day.grammarPoints[0],
      structures: ['V/A/na/N普', 'naだな', 'Nだの', 'ふりをする'],
    }] }} />);

    expect(screen.getByText(']', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText('[', { selector: 'span' })).not.toBeInTheDocument();
    expect(screen.getByText('naだな').closest('.grammar-structure-variant')).toBeInTheDocument();
    expect(screen.getByText('ふりをする').closest('.grammar-structure-suffix')).toBeInTheDocument();
  });

  it('groups verb forms before the grammar ending inside square brackets', () => {
    render(<GrammarLessonView day={{ ...day, grammarPoints: [{
      ...day.grammarPoints[0],
      structures: ['Vる', 'Vない', 'ようにする'],
    }] }} />);

    expect(screen.getByText(']', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Vる').closest('.grammar-structure-variant')).toBeInTheDocument();
    expect(screen.getByText('ようにする').closest('.grammar-structure-suffix')).toBeInTheDocument();
  });

  it('underlines only the grammar portion of the lesson title', () => {
    render(<GrammarLessonView day={{ ...day, grammarPoints: [{
      ...day.grammarPoints[0],
      titleJa: '会員だけしか',
      structures: ['NだけしかVない'],
    }] }} />);

    const title = screen.getByRole('heading', { name: '会員だけしか' });
    const underline = title.querySelector('.grammar-underline');
    expect(underline).toHaveTextContent('だけしか');
    expect(underline).not.toHaveTextContent('会員');
  });

  it('keeps the example translation switch compact', () => {
    render(<GrammarLessonView day={day} />);

    const translationSwitch = screen.getByRole('switch', { name: 'Hiện nghĩa ví dụ' });
    expect(translationSwitch.closest('label')).toHaveClass('grammar-translation-toggle');
    expect(screen.queryByText(/Mặc định tắt/)).not.toBeInTheDocument();
  });

  it('removes the equivalence marker from Japanese paraphrases', () => {
    const example = {
      ...day.grammarPoints[0].examples[0],
      paraphraseJa: '(=実際は、受けなかったが)',
    };
    render(<GrammarLessonView day={{ ...day, grammarPoints: [{ ...day.grammarPoints[0], examples: [example] }] }} />);

    expect(screen.getByText('(実際は、受けなかったが)')).toBeInTheDocument();
    expect(screen.queryByText(/=/)).not.toBeInTheDocument();
  });

  it('shows one grammar point card at a time and advances to the next card', () => {
    const secondPoint = {
      ...day.grammarPoints[0],
      id: 'g2',
      titleJa: 'ようだ',
      examples: [{ ...day.grammarPoints[0].examples[0], id: 'e2' }],
    };
    render(<GrammarLessonView day={{ ...day, grammarPoints: [day.grammarPoints[0], secondPoint] }} />);

    expect(screen.getByRole('heading', { name: '書かれている' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'ようだ' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bắt đầu luyện tập' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }));
    expect(screen.queryByRole('heading', { name: '書かれている' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ようだ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bắt đầu luyện tập' })).toBeInTheDocument();
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
