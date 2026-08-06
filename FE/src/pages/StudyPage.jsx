import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Layers, Lightbulb, Keyboard, ListChecks, ChevronRight, RotateCcw, Trophy, X, Check, Shuffle, Eye, EyeOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';
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
  const [showMeaning, setShowMeaning] = useState(() => {
    const saved = localStorage.getItem('tango_show_meaning');
    return saved !== null ? saved === 'true' : true;
  });
  const inputRef = useRef(null);

  const {
    sessionId,
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
    changeMode,
    checkAnswer,
    getHint,
    nextWord,
    previousWord,
    resetSession,
  } = useStudySession();

  // Start session on mount
  useEffect(() => {
    if (setId) {
      startSession(setId, isShuffled, studyMode);
    }
    return () => resetSession();
  // The initial route decides the first mode. Mode changes use changeMode so
  // the current question and session progress are preserved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSession, setId, startSession]);

  // Focus input when word changes
  useEffect(() => {
    if (currentWord && !checkResult && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
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

  const handleModeChange = async (mode) => {
    if (mode === studyMode || !sessionId) return;

    const previousMode = studyMode;
    setStudyMode(mode);
    setInputValue('');
    setIsFlashcardFlipped(false);

    try {
      await changeMode(mode);
    } catch {
      setStudyMode(previousMode);
      toast.error('Không thể chuyển chế độ học');
    }
  };

  useEffect(() => {
    setIsFlashcardFlipped(false);
  }, [currentWord?.id]);

  // The answer input is removed from the DOM after checking. Listen on the
  // window so Enter still advances when the feedback/Next button is shown.
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!['reading', 'quiz'].includes(studyMode) || e.key !== 'Enter' || e.isComposing || !currentWord || isCompleted) return;

      e.preventDefault();
      if (checkResult) {
        handleNext();
      } else if (studyMode === 'reading') {
        handleCheck();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [checkResult, currentWord, isCompleted, handleCheck, handleNext, studyMode]);

  const handleQuizSelect = useCallback((option) => {
    if (studyMode !== 'quiz' || checkResult || isChecking || !option) return;
    checkAnswer(option, 0);
  }, [checkAnswer, checkResult, isChecking, studyMode]);

  useEffect(() => {
    const handleQuizKeyDown = (event) => {
      if (studyMode !== 'quiz' || !currentWord || isCompleted || checkResult) return;
      if (event.target instanceof HTMLElement && event.target.closest('button')) return;

      const optionNumber = Number(event.key);
      if (optionNumber >= 1 && optionNumber <= 4) {
        event.preventDefault();
        handleQuizSelect(currentWord.quizOptions?.[optionNumber - 1]);
      }
    };

    window.addEventListener('keydown', handleQuizKeyDown);
    return () => window.removeEventListener('keydown', handleQuizKeyDown);
  }, [checkResult, currentWord, handleQuizSelect, isCompleted, studyMode]);

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
      startSession(setId, nextState, studyMode);
    }
  };

  const handleToggleMeaning = () => {
    setShowMeaning((prev) => {
      const next = !prev;
      localStorage.setItem('tango_show_meaning', String(next));
      return next;
    });
  };

  const handleRestartStudy = () => {
    resetSession();
    if (setId) {
      startSession(setId, isShuffled, studyMode);
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
          <span lang="ja" key={i} className="hint-char">
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
            {/* Meaning Toggle Button (Bật/Tắt Hiển thị Nghĩa) */}
            {studyMode === 'reading' && (
              <button
                type="button"
                onClick={handleToggleMeaning}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                  showMeaning
                    ? 'bg-accent-orange/20 border-accent-orange text-accent-orange shadow-sm shadow-accent-orange/20'
                    : 'bg-primary-900/60 border-white/10 text-primary-400 hover:text-white hover:border-white/20'
                }`}
                title={showMeaning ? 'Đang bật hiển thị nghĩa (Nhấn để tắt)' : 'Đang tắt hiển thị nghĩa (Nhấn để bật)'}
              >
                {showMeaning ? (
                  <Eye className="w-3.5 h-3.5 text-accent-orange" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-primary-400" />
                )}
                <span>
                  Nghĩa: <strong className={showMeaning ? 'text-accent-orange' : 'text-primary-300'}>{showMeaning ? 'Bật' : 'Tắt'}</strong>
                </span>
              </button>
            )}

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
              <button
                onClick={() => handleModeChange('quiz')}
                className={`toggle-btn flex-1 sm:flex-none flex items-center justify-center gap-1.5 ${studyMode === 'quiz' ? 'active' : ''}`}
                aria-selected={studyMode === 'quiz'}
                role="tab"
              >
                <ListChecks className="w-3.5 h-3.5" /> Trắc nghiệm
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
                      <span lang="ja" className="kanji-display">{currentWord.kanji?.trim() || currentWord.hiragana}</span>
                      <span className="text-primary-500 text-xs mt-10">Nhấn để lật thẻ</span>
                    </span>
                    <span className="flashcard-face flashcard-back study-card flex flex-col items-center justify-center !p-5 sm:!p-8">
                      <span className="text-xs uppercase tracking-widest text-accent-green font-semibold mb-8">Nghĩa & cách đọc</span>
                      <span className="text-primary-200 text-xl sm:text-2xl text-center mb-5">{currentWord.meaning}</span>
                      <span lang="ja" className="hiragana-result text-accent-green">{currentWord.hiragana}</span>
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
              ) : studyMode === 'quiz' ? (
                <div>
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase tracking-widest text-accent-orange font-semibold mb-4">
                      Chọn cách đọc đúng
                    </p>
                    <h2 lang="ja" className="kanji-display mb-2">{currentWord.kanji}</h2>
                    <p className="meaning-text">{currentWord.meaning}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5" role="radiogroup" aria-label="Các đáp án cách đọc">
                    {(currentWord.quizOptions || []).map((option, index) => {
                      const isCorrectOption = checkResult && option === checkResult.correctAnswer;
                      const isSelectedWrong = checkResult && option === checkResult.userAnswer && !checkResult.isCorrect;
                      const stateClass = isCorrectOption
                        ? 'border-accent-green bg-accent-green/20 text-accent-green'
                        : isSelectedWrong
                          ? 'border-accent-red bg-accent-red/20 text-accent-red'
                          : checkResult
                            ? 'border-white/10 bg-primary-900/40 text-primary-500 opacity-70'
                            : 'border-white/15 bg-primary-900/60 text-white hover:border-accent-orange hover:bg-accent-orange/10';

                      return (
                        <button
                          key={`${option}-${index}`}
                          type="button"
                          onClick={() => handleQuizSelect(option)}
                          disabled={!!checkResult || isChecking}
                          className={`min-h-16 rounded-xl border-2 px-4 py-3 text-lg font-japanese font-semibold transition-all ${stateClass}`}
                          role="radio"
                          aria-checked={checkResult?.userAnswer === option}
                        >
                          <span className="mr-3 text-sm font-sans opacity-60">{index + 1}.</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {checkResult ? (
                    <div className="animate-fade-in space-y-4">
                      <div className={`py-3.5 px-6 rounded-xl text-center font-semibold text-lg ${
                        checkResult.isCorrect ? 'result-correct' : 'result-wrong'
                      }`}>
                        <div className="flex items-center justify-center gap-2">
                          {checkResult.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          <span>{checkResult.isCorrect ? 'Chính xác!' : 'Sai rồi!'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="btn-check w-full flex items-center justify-center gap-2"
                      >
                        Tiếp theo
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-primary-500">
                      Nhấn <kbd className="px-2 py-0.5 rounded bg-primary-700 text-primary-300 text-xs font-mono mx-1">1–4</kbd> để chọn đáp án
                    </p>
                  )}
                </div>
              ) : (
                <>
              {/* Kanji Display */}
              <div className="text-center mb-6">
                <h2 lang="ja" className="kanji-display mb-2">{currentWord.kanji}</h2>
                <div className="h-7 flex items-center justify-center">
                  <p className={`meaning-text transition-all duration-300 ${
                    showMeaning || (checkResult && checkResult.isCorrect)
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-1 pointer-events-none'
                  }`}>
                    {currentWord.meaning}
                  </p>
                </div>
              </div>

              {/* Hint Dashes or Result Hiragana */}
              <div className="text-center mb-6 h-14 flex items-center justify-center">
                {checkResult ? (
                  <p lang="ja" className={`hiragana-result transition-all duration-300 ${
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
              <div className="min-h-[140px] flex flex-col justify-end">
                {!checkResult ? (
                  <div className="animate-fade-in space-y-4">
                    {/* Input */}
                    <div>
                      <HiraganaInput
                        ref={inputRef}
                        value={inputValue}
                        onChange={setInputValue}
                        placeholder="Gõ romaji (vd: toshokan → としょかん)"
                        disabled={!!checkResult}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={getHint}
                        disabled={hintsUsed >= totalChars}
                        className="btn-hint flex items-center justify-center gap-2"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Gợi ý ({hintsUsed}/{totalChars})
                      </button>
                      <button
                        type="button"
                        onClick={handleCheck}
                        disabled={!inputValue.trim() || isChecking}
                        className="btn-check flex items-center justify-center gap-2"
                      >
                        <Keyboard className="w-4 h-4" />
                        Kiểm tra
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-4">
                    {/* Result Feedback */}
                    <div className={`py-3.5 px-6 rounded-xl text-center font-semibold text-lg transition-all duration-300 ${
                      checkResult.isCorrect ? 'result-correct' : 'result-wrong'
                    }`}>
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-2">
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
                        {checkResult.isCorrect && !showMeaning && (
                          <p className="text-sm font-medium text-white/90 mt-0.5 animate-fade-in">
                            Nghĩa: <span className="text-accent-green font-semibold">{currentWord.meaning}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-check w-full flex items-center justify-center gap-2"
                    >
                      Tiếp theo
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

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
              {studyMode !== 'flashcard' && (
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
