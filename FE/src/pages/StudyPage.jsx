import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Layers, Lightbulb, Keyboard, ChevronRight, RotateCcw, Trophy, X, Check, Shuffle, ListOrdered } from 'lucide-react';
import { Toaster } from 'sonner';
import useStudySession from '@/hooks/useStudySession';
import HiraganaInput from '@/components/study/HiraganaInput';

export default function StudyPage() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [inputValue, setInputValue] = useState('');
  const [studyMode, setStudyMode] = useState(
    location.pathname.startsWith('/flashcards/') ? 'flashcard' : 'reading',
  );
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const inputRef = useRef(null);

  const {
    currentWord,
    checkResult,
    hintsUsed,
    hintText,
    totalChars,
    isLoading,
    isChecking,
    isCompleted,
    results,
    error,
    startSession,
    checkAnswer,
    getHint,
    nextWord,
    previousWord,
    resetSession,
  } = useStudySession();

  // Start session on mount
  useEffect(() => {
    if (setId) {
      startSession(setId, isShuffled);
    }
    return () => resetSession();
  }, [resetSession, setId, startSession]);

  // Focus input when word changes
  useEffect(() => {
    if (currentWord && !checkResult && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentWord, checkResult]);

  const handleCheck = useCallback(() => {
    if (!inputValue.trim() || checkResult || isChecking) return;
    checkAnswer(inputValue.trim());
  }, [checkAnswer, checkResult, inputValue, isChecking]);

  const handleNext = useCallback(async () => {
    if (!currentWord || isLoading) return;
    setInputValue('');
    await nextWord();
  }, [currentWord, isLoading, nextWord]);

  const handleFlashcardNext = useCallback(async () => {
    if (!currentWord || isLoading) return;
    await nextWord();
  }, [currentWord, isLoading, nextWord]);

  const handleFlashcardPrevious = useCallback(async () => {
    if (!currentWord || isLoading || currentWord.currentIndex === 0) return;
    await previousWord();
  }, [currentWord, isLoading, previousWord]);

  const handleModeChange = (mode) => {
    setStudyMode(mode);
    setIsFlashcardFlipped(false);
  };

  useEffect(() => {
    setIsFlashcardFlipped(false);
  }, [currentWord?.id]);

  // The answer input is removed from the DOM after checking. Listen on the
  // window so Enter still advances when the feedback/Next button is shown.
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (studyMode !== 'reading' || e.key !== 'Enter' || e.isComposing || !currentWord || isCompleted) return;

      // Let a focused button handle its own native Enter click once.
      if (e.target instanceof HTMLElement && e.target.closest('button')) return;

      e.preventDefault();
      if (checkResult) {
        handleNext();
      } else {
        handleCheck();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [checkResult, currentWord, isCompleted, handleCheck, handleNext, studyMode]);

  useEffect(() => {
    const handleFlashcardKeyDown = (event) => {
      if (studyMode !== 'flashcard' || !currentWord || isCompleted) return;
      if (event.target instanceof HTMLElement && event.target.closest('button')) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setIsFlashcardFlipped((flipped) => !flipped);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleFlashcardNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleFlashcardPrevious();
      }
    };

    window.addEventListener('keydown', handleFlashcardKeyDown);
    return () => window.removeEventListener('keydown', handleFlashcardKeyDown);
  }, [currentWord, handleFlashcardNext, handleFlashcardPrevious, isCompleted, studyMode]);

  const handleToggleShuffle = () => {
    const nextState = !isShuffled;
    setIsShuffled(nextState);
    setInputValue('');
    setIsFlashcardFlipped(false);
    if (setId) {
      resetSession();
      startSession(setId, nextState);
    }
  };

  const handleRestartStudy = () => {
    resetSession();
    if (setId) {
      startSession(setId, isShuffled);
      setInputValue('');
    }
  };

  // Render hint dashes
  const renderHintDashes = () => {
    if (!currentWord) return null;

    const chars = [];
    for (let i = 0; i < totalChars; i++) {
      if (i < hintsUsed && hintText[i]) {
        chars.push(
          <span key={i} className="hint-char">
            {hintText[i]}
          </span>
        );
      } else {
        chars.push(<span key={i} className="hint-dash" />);
      }
    }
    return chars;
  };

  // Loading state
  if (isLoading && !currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-accent-orange border-t-transparent animate-spin" />
          <p className="text-primary-400">Đang tải bộ từ vựng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-red text-lg mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-hint">
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Completed - Results screen
  if (isCompleted && results) {
    return (
      <div className="min-h-screen flex flex-col">
        <Toaster position="top-right" theme="dark" />

        <header className="py-6 px-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-primary-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Trang chủ</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-8 pb-12">
          <div className="w-full max-w-lg animate-scale-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-orange to-yellow-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Hoàn thành!</h2>
              <p className="text-primary-400">{results.setName}</p>
            </div>

            <div className="study-card mb-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <p className="text-3xl font-bold text-accent-green">{results.correctCount}</p>
                  <p className="text-sm text-primary-400">Đúng</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent-red">{results.wrongCount}</p>
                  <p className="text-sm text-primary-400">Sai</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent-orange">{results.accuracy}%</p>
                  <p className="text-sm text-primary-400">Chính xác</p>
                </div>
              </div>

              {/* Progress bar showing accuracy */}
              <div className="progress-bar-container h-3">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${results.accuracy}%` }}
                />
              </div>
            </div>

            {/* Wrong answers review */}
            {results.wrongAnswers.length > 0 && (
              <div className="study-card mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <X className="w-4 h-4 text-accent-red" />
                  Từ cần ôn lại ({results.wrongAnswers.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {results.wrongAnswers.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-primary-800/50 rounded-lg p-3">
                      <div>
                        <span className="font-japanese font-medium">{item.kanji}</span>
                        <span className="text-primary-400 text-sm ml-2">({item.meaning})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-accent-green font-japanese text-sm">{item.hiragana}</span>
                        <span className="text-accent-red font-japanese text-xs block line-through">
                          {item.userAnswer}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleRestartStudy} className="btn-check flex-1 flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Học lại
              </button>
              <button onClick={() => navigate('/')} className="btn-hint flex-1">
                Trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main study interface
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <header className="py-4 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-primary-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Thoát</span>
          </button>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {/* Shuffle Toggle Button (Bật/Tắt Xáo trộn) */}
            <button
              type="button"
              onClick={handleToggleShuffle}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                isShuffled
                  ? 'bg-accent-orange/20 border-accent-orange text-accent-orange shadow-sm shadow-accent-orange/20'
                  : 'bg-primary-900/60 border-white/10 text-primary-400 hover:text-white hover:border-white/20'
              }`}
              title={isShuffled ? 'Đang bật xáo trộn (Nhấn để tắt)' : 'Đang tắt xáo trộn (Nhấn để bật)'}
            >
              <Shuffle className={`w-3.5 h-3.5 ${isShuffled ? 'text-accent-orange' : 'text-primary-400'}`} />
              <span>Xáo trộn: <strong className={isShuffled ? 'text-accent-orange' : 'text-primary-300'}>{isShuffled ? 'Bật' : 'Tắt'}</strong></span>
            </button>

            {/* Study Mode Toggle */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Chế độ học">
              <button
                onClick={() => handleModeChange('reading')}
                className={`toggle-btn flex-1 sm:flex-none flex items-center justify-center gap-1.5 ${studyMode === 'reading' ? 'active' : ''}`}
                aria-selected={studyMode === 'reading'}
                role="tab"
              >
                <Keyboard className="w-3.5 h-3.5" /> Cách đọc
              </button>
              <button
                onClick={() => handleModeChange('flashcard')}
                className={`toggle-btn flex-1 sm:flex-none flex items-center justify-center gap-1.5 ${studyMode === 'flashcard' ? 'active' : ''}`}
                aria-selected={studyMode === 'flashcard'}
                role="tab"
              >
                <Layers className="w-3.5 h-3.5" /> Flashcard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main study area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-6">
        <div className="w-full max-w-2xl">
          {currentWord && (
            <div className="animate-fade-in">
              {studyMode === 'flashcard' ? (
                <div>
                  <div className="flex items-center justify-between mb-3 text-sm text-primary-400">
                    <span>Ôn tập flashcard</span>
                    <span>{isFlashcardFlipped ? 'Mặt sau' : 'Mặt trước'}</span>
                  </div>

                  <button
                    type="button"
                    className={`flashcard-scene w-full h-[18rem] sm:h-[24rem] text-left ${isFlashcardFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsFlashcardFlipped((flipped) => !flipped)}
                    aria-label={isFlashcardFlipped ? 'Lật về mặt trước' : 'Lật sang mặt sau'}
                  >
                    <span className="flashcard-face flashcard-front study-card flex flex-col items-center justify-center !p-5 sm:!p-8">
                      <span className="text-xs uppercase tracking-widest text-accent-orange font-semibold mb-8">Từ vựng</span>
                      <span className="kanji-display">{currentWord.kanji?.trim() || currentWord.hiragana}</span>
                      <span className="text-primary-500 text-xs mt-10">Nhấn để lật thẻ</span>
                    </span>
                    <span className="flashcard-face flashcard-back study-card flex flex-col items-center justify-center !p-5 sm:!p-8">
                      <span className="text-xs uppercase tracking-widest text-accent-green font-semibold mb-8">Nghĩa & cách đọc</span>
                      <span className="text-primary-200 text-xl sm:text-2xl text-center mb-5">{currentWord.meaning}</span>
                      <span className="hiragana-result text-accent-green">{currentWord.hiragana}</span>
                      <span className="text-primary-500 text-xs mt-10">Nhấn để xem lại từ vựng</span>
                    </span>
                  </button>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
                    <button
                      onClick={handleFlashcardPrevious}
                      disabled={isLoading || currentWord.currentIndex === 0}
                      className="btn-hint text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Trước
                    </button>
                    <button
                      onClick={() => setIsFlashcardFlipped((flipped) => !flipped)}
                      className="btn-hint text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Lật thẻ
                    </button>
                    <button
                      onClick={handleFlashcardNext}
                      disabled={isLoading}
                      className="btn-check text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2"
                    >
                      {currentWord.currentIndex + 1 === currentWord.totalWords ? 'Hoàn thành' : 'Tiếp'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-center text-xs sm:text-sm text-primary-500 mt-5">
                    Dùng <kbd className="px-1.5 py-0.5 rounded bg-primary-700 text-primary-300 font-mono mx-1">Space</kbd> để lật · <kbd className="px-1.5 py-0.5 rounded bg-primary-700 text-primary-300 font-mono mx-1">← →</kbd> để chuyển thẻ
                  </p>
                </div>
              ) : (
                <>
              {/* Kanji Display */}
              <div className="text-center mb-8">
                <h2 className="kanji-display mb-3">{currentWord.kanji}</h2>
                <p className="meaning-text">{currentWord.meaning}</p>
              </div>

              {/* Hint Dashes or Result Hiragana */}
              <div className="text-center mb-8 min-h-[3rem] flex items-center justify-center">
                {checkResult ? (
                  <p className={`hiragana-result animate-scale-in ${
                    checkResult.isCorrect ? 'text-accent-green' : 'text-accent-red'
                  }`}>
                    {checkResult.correctAnswer}
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {renderHintDashes()}
                  </div>
                )}
              </div>

              {/* Input or Result Feedback */}
              {!checkResult ? (
                <>
                  {/* Input */}
                  <div className="mb-4">
                    <HiraganaInput
                      ref={inputRef}
                      value={inputValue}
                      onChange={setInputValue}
                      placeholder="Gõ romaji (vd: toshokan → としょかん)"
                      disabled={!!checkResult}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={getHint}
                      disabled={hintsUsed >= totalChars}
                      className="btn-hint flex items-center justify-center gap-2"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Gợi ý ({hintsUsed}/{totalChars})
                    </button>
                    <button
                      onClick={handleCheck}
                      disabled={!inputValue.trim() || isChecking}
                      className="btn-check flex items-center justify-center gap-2"
                    >
                      <Keyboard className="w-4 h-4" />
                      Kiểm tra
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Result Feedback */}
                  <div className={`mb-4 ${checkResult.isCorrect ? 'result-correct' : 'result-wrong'}`}>
                    <div className="flex items-center justify-center gap-2">
                      {checkResult.isCorrect ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Chính xác!</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5" />
                          <span>Sai rồi!</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    className="btn-check w-full flex items-center justify-center gap-2 mb-6"
                  >
                    Tiếp theo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Enter shortcut hint */}
              <p className="text-center text-sm text-primary-500">
                Nhấn <kbd className="px-2 py-0.5 rounded bg-primary-700 text-primary-300 text-xs font-mono mx-1">Enter</kbd> để {checkResult ? 'tiếp theo' : 'kiểm tra'}
              </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (bottom) */}
      {currentWord && (
        <div className="px-4 sm:px-8 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-400">
                {currentWord.currentIndex + 1} / {currentWord.totalWords}
              </span>
              {studyMode === 'reading' && (
                <span className="text-xs text-primary-500">
                  ✓ {currentWord.correctCount || 0} &nbsp; ✗ {currentWord.wrongCount || 0}
                </span>
              )}
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${((currentWord.currentIndex + 1) / currentWord.totalWords) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
