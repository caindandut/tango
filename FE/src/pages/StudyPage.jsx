import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Layers, Lightbulb, Keyboard, ListChecks, ChevronRight, RotateCcw, Trophy, X, Check, Shuffle, Eye, EyeOff, Settings2, ChevronDown, Maximize2, Minimize2, LoaderCircle } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import useStudySession from '@/hooks/useStudySession';
import HiraganaInput from '@/components/study/HiraganaInput';
import VocabularyExamples from '@/components/study/VocabularyExamples';
import { shouldShowQuizMeaning } from '@/lib/studyPresentation';

const STUDY_MODE_OPTIONS = [
  { value: 'reading', label: 'Cách đọc', icon: Keyboard },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'quiz', label: 'Trắc nghiệm', icon: ListChecks },
];

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showMeaning, setShowMeaning] = useState(() => {
    const saved = localStorage.getItem('tango_show_meaning');
    return saved !== null ? saved === 'true' : true;
  });
  const inputRef = useRef(null);
  const vocabularyRef = useRef(null);
  const inputFocusTimerRef = useRef(null);
  const viewportResizeCleanupRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const modeMenuRef = useRef(null);

  const focusVocabulary = useCallback(() => {
    vocabularyRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, []);

  const handleInputFocus = useCallback(() => {
    if (!window.matchMedia('(max-width: 640px)').matches) return;

    setIsKeyboardOpen(true);
    window.clearTimeout(inputFocusTimerRef.current);
    inputFocusTimerRef.current = window.setTimeout(() => {
      focusVocabulary();
    }, 350);

    viewportResizeCleanupRef.current?.();
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportResize = () => {
      focusVocabulary();
      viewportResizeCleanupRef.current?.();
    };

    viewport.addEventListener('resize', handleViewportResize);
    viewportResizeCleanupRef.current = () => {
      viewport.removeEventListener('resize', handleViewportResize);
      viewportResizeCleanupRef.current = null;
    };

    window.setTimeout(() => viewportResizeCleanupRef.current?.(), 1500);
  }, [focusVocabulary]);

  const handleInputBlur = useCallback(() => {
    window.setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        setIsKeyboardOpen(false);
        viewportResizeCleanupRef.current?.();
      }
    }, 200);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(inputFocusTimerRef.current);
    viewportResizeCleanupRef.current?.();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenEnabled) {
        setIsFocusMode(Boolean(document.fullscreenElement));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFocusMode = useCallback(async () => {
    if (isFocusMode) {
      setIsFocusMode(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      return;
    }

    setIsFocusMode(true);
    if (document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // iOS Safari may reject Fullscreen API requests; CSS focus mode remains active.
      }
    }
  }, [isFocusMode]);

  const activeMode = STUDY_MODE_OPTIONS.find((option) => option.value === studyMode) || STUDY_MODE_OPTIONS[0];
  const ActiveModeIcon = activeMode.icon;
  const isQuizMeaningVisible = shouldShowQuizMeaning(showMeaning, checkResult);

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

  const handleSelectMode = async (mode) => {
    setIsModeMenuOpen(false);
    await handleModeChange(mode);
  };

  useEffect(() => {
    if (!isSettingsOpen && !isModeMenuOpen) return undefined;

    const handleMenuDismiss = (event) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsModeMenuOpen(false);
        return;
      }

      if (event.type === 'mousedown') {
        if (isSettingsOpen && !settingsMenuRef.current?.contains(event.target)) {
          setIsSettingsOpen(false);
        }
        if (isModeMenuOpen && !modeMenuRef.current?.contains(event.target)) {
          setIsModeMenuOpen(false);
        }
      }
    };

    window.addEventListener('mousedown', handleMenuDismiss);
    window.addEventListener('keydown', handleMenuDismiss);
    return () => {
      window.removeEventListener('mousedown', handleMenuDismiss);
      window.removeEventListener('keydown', handleMenuDismiss);
    };
  }, [isModeMenuOpen, isSettingsOpen]);

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
      <div className="study-page min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border-4 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          <p className="text-slate-300 text-sm font-medium">Đang tải bộ từ vựng...</p>
          <p className="text-slate-500 text-xs mt-2">Chuẩn bị bài học cho bạn</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentWord) {
    return (
      <div className="study-page min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <button onClick={handleRestartStudy} className="btn-check mb-4 max-w-xs mx-auto">
            Thử lại
          </button>
          <p className="text-rose-400 text-lg mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-hint">
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Empty state: the session returned no word to study.
  if (!isLoading && !currentWord && !isCompleted) {
    return (
      <div className="study-page min-h-screen flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl shadow-black/20 sm:p-8" role="status">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300">
            <Layers className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-white">Chưa có từ vựng để học</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Bài học này hiện chưa có dữ liệu. Hãy quay lại và chọn bài khác.</p>
          <button type="button" onClick={() => navigate('/')} className="btn-check mt-6">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Completed - Results screen
  if (isCompleted && results) {
    return (
      <div className="study-page min-h-screen flex flex-col">
        <Toaster position="top-right" theme="dark" />

        <header className="py-4 sm:py-6 px-4 sm:px-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Trang chủ</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-8 sm:pb-12">
          <div className="w-full max-w-lg animate-scale-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-orange to-yellow-500 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Hoàn thành!</h2>
              <p className="text-slate-500">{results.setName}</p>
            </div>

            <div className="study-card mb-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <p className="text-3xl font-bold text-accent-green">{results.correctCount}</p>
                  <p className="text-sm text-slate-500">Đúng</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent-red">{results.wrongCount}</p>
                  <p className="text-sm text-slate-500">Sai</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-indigo-600">{results.accuracy}%</p>
                  <p className="text-sm text-slate-500">Chính xác</p>
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
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div>
                        <span className="font-japanese font-medium">{item.kanji}</span>
                        <span className="text-slate-500 text-sm ml-2">({item.meaning})</span>
                      </div>
                      <div className="text-left sm:text-right">
                      <span className="text-emerald-600 font-japanese text-sm">{item.hiragana}</span>
                      <span className="text-red-600 font-japanese text-xs block line-through">
                          {item.userAnswer}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
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
    <div className={`study-page min-h-screen flex flex-col ${isFocusMode ? 'focus-mode' : ''} ${isKeyboardOpen ? 'keyboard-open' : ''}`}>
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <header className="study-header py-3 sm:py-4 px-3 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Thoát</span>
          </button>

          <div className="flex items-center justify-end gap-2">
            <div className="relative" ref={settingsMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen((open) => !open);
                  setIsModeMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:px-3.5 ${
                  isSettingsOpen
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 bg-slate-900 text-slate-300 hover:border-indigo-400 hover:text-white'
                }`}
                aria-expanded={isSettingsOpen}
                aria-haspopup="menu"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Cài đặt</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-xl shadow-black/30 backdrop-blur-xl" role="menu">
                  <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Cài đặt học</p>
                  <button
                    type="button"
                    onClick={handleToggleMeaning}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
                    role="menuitem"
                    aria-pressed={showMeaning}
                  >
                    <span className="flex items-center gap-2.5">
                      {showMeaning ? <Eye className="h-4 w-4 text-indigo-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                      Hiển thị nghĩa
                    </span>
                    <span className={`text-xs font-bold ${showMeaning ? 'text-indigo-600' : 'text-slate-400'}`}>{showMeaning ? 'Bật' : 'Tắt'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleShuffle}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
                    role="menuitem"
                    aria-pressed={isShuffled}
                  >
                    <span className="flex items-center gap-2.5">
                      <Shuffle className={`h-4 w-4 ${isShuffled ? 'text-indigo-600' : 'text-slate-400'}`} />
                      Xáo trộn từ
                    </span>
                    <span className={`text-xs font-bold ${isShuffled ? 'text-indigo-600' : 'text-slate-400'}`}>{isShuffled ? 'Bật' : 'Tắt'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      handleToggleFocusMode();
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-white/5"
                    role="menuitem"
                    aria-pressed={isFocusMode}
                  >
                    <span className="flex items-center gap-2.5">
                      {isFocusMode ? <Minimize2 className="h-4 w-4 text-indigo-600" /> : <Maximize2 className="h-4 w-4 text-slate-400" />}
                      Toàn màn hình
                    </span>
                    <span className={`text-xs font-bold ${isFocusMode ? 'text-indigo-600' : 'text-slate-400'}`}>{isFocusMode ? 'Bật' : 'Tắt'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsModeMenuOpen((open) => !open);
                  setIsSettingsOpen(false);
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all sm:px-3.5 ${
                  isModeMenuOpen
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 bg-slate-900 text-slate-300 hover:border-indigo-400 hover:text-white'
                }`}
                aria-expanded={isModeMenuOpen}
                aria-haspopup="menu"
              >
                <ActiveModeIcon className="h-4 w-4 text-indigo-600" />
                <span>{activeMode.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isModeMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModeMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-xl shadow-black/30 backdrop-blur-xl" role="menu">
                  <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Chế độ học</p>
                  {STUDY_MODE_OPTIONS.map(({ value, label, icon: ModeIcon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSelectMode(value)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                        studyMode === value
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'text-slate-200 hover:bg-white/5'
                      }`}
                      role="menuitemradio"
                      aria-checked={studyMode === value}
                    >
                      <span className="flex items-center gap-2.5">
                        <ModeIcon className="h-4 w-4" />
                        {label}
                      </span>
                      {studyMode === value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main study area */}
      <div className="study-main flex-1 flex items-center justify-center px-3 py-3 sm:px-8 sm:py-6">
        <div className="w-full max-w-3xl">
          {currentWord && (
            <div className={`animate-fade-in ${studyMode === 'flashcard' ? '' : 'study-card !max-w-3xl'}`}>
              {error && (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
                  <span>{error}</span>
                  <button type="button" onClick={handleRestartStudy} className="shrink-0 rounded-lg border border-rose-300/30 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20">
                    Thử lại bài học
                  </button>
                </div>
              )}
              {isLoading && (
                <span className="sr-only" role="status" aria-live="polite">Đang chuyển sang từ tiếp theo</span>
              )}
              {currentWord.isReviewRound && studyMode !== 'flashcard' && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-center text-sm text-indigo-700">
                  Ôn lại {currentWord.reviewRoundSize} từ đã trả lời sai
                </div>
              )}
              {studyMode === 'flashcard' ? (
                <div>
                  <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
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
                      <span className="text-xs uppercase tracking-widest text-indigo-600 font-semibold mb-8">Từ vựng</span>
                      <span lang="ja" className="kanji-display">{currentWord.kanji?.trim() || currentWord.hiragana}</span>
                      <span className="text-slate-400 text-xs mt-10">Nhấn để lật thẻ</span>
                    </span>
                    <span className="flashcard-face flashcard-back study-card flex flex-col items-center justify-center !p-5 sm:!p-8">
                      <span className="text-xs uppercase tracking-widest text-emerald-600 font-semibold mb-8">Nghĩa & cách đọc</span>
                      <span className="text-slate-700 text-xl sm:text-2xl text-center mb-5">{currentWord.meaning}</span>
                      <span lang="ja" className="hiragana-result text-emerald-600">{currentWord.hiragana}</span>
                      <span className="text-slate-400 text-xs mt-10">Nhấn để xem lại từ vựng</span>
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
                      {isLoading ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Đang tải</span>
                        </>
                      ) : (
                        <>
                          {currentWord.currentIndex + 1 === currentWord.totalWords ? 'Hoàn thành' : 'Tiếp'}
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="hidden sm:block text-center text-xs sm:text-sm text-slate-400 mt-6">
                    Dùng <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono mx-1">Space</kbd> để lật · <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono mx-1">← →</kbd> để chuyển thẻ
                  </p>
                </div>
              ) : studyMode === 'quiz' ? (
                <div>
                  <div className="text-center mb-6">
                    <p className="text-xs uppercase tracking-widest text-indigo-600 font-semibold mb-4">
                      Chọn cách đọc đúng
                    </p>
                    <h2 lang="ja" className="kanji-display mb-2">{currentWord.kanji}</h2>
                    <p
                      className={`meaning-text transition-all duration-300 ${
                        isQuizMeaningVisible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 -translate-y-1 pointer-events-none'
                      }`}
                      aria-hidden={!isQuizMeaningVisible}
                    >
                      {currentWord.meaning}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5" role="radiogroup" aria-label="Các đáp án cách đọc">
                    {(currentWord.quizOptions || []).map((option, index) => {
                      const isCorrectOption = checkResult && option === checkResult.correctAnswer;
                      const isSelectedWrong = checkResult && option === checkResult.userAnswer && !checkResult.isCorrect;
                      const stateClass = isCorrectOption
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : isSelectedWrong
                          ? 'border-red-400 bg-red-500/20 text-red-300'
                          : checkResult
                            ? 'border-white/10 bg-primary-900/40 text-primary-500 opacity-70'
                            : 'border-white/15 bg-primary-900/60 text-white hover:border-indigo-400 hover:bg-indigo-500/10';

                      return (
                        <button
                          key={`${option}-${index}`}
                          type="button"
                          onClick={() => handleQuizSelect(option)}
                          disabled={!!checkResult || isChecking}
                          className={`min-h-16 rounded-xl border-2 px-2 sm:px-4 py-3 text-base sm:text-lg font-japanese font-semibold transition-all ${stateClass}`}
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
                      {checkResult && <VocabularyExamples examples={currentWord.examples} />}
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isLoading}
                        className="btn-check w-full flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                            Đang tải
                          </>
                        ) : (
                          <>
                            Tiếp theo
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <p className="hidden sm:block text-center text-sm text-slate-400 mt-6">
                      Nhấn <kbd className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-xs font-mono mx-1">1–4</kbd> để chọn đáp án
                    </p>
                  )}
                </div>
              ) : (
                <>
              {/* Kanji Display */}
              <div ref={vocabularyRef} className="study-vocabulary scroll-mt-16 text-center mb-6">
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
                    checkResult.isCorrect ? 'text-emerald-600' : 'text-red-600'
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
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
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
                        {!checkResult.isCorrect && (
                          <div className="mt-2 space-y-1 text-left text-sm font-medium">
                            <p>
                              <span className="text-red-200/75">Đã nhập:</span>{' '}
                              <span lang="ja" className="font-japanese text-red-100">{checkResult.userAnswer || '—'}</span>
                            </p>
                            <p>
                              <span className="text-red-200/75">Đáp án:</span>{' '}
                              <span lang="ja" className="font-japanese font-semibold text-white">{checkResult.correctAnswer}</span>
                            </p>
                          </div>
                        )}
                        {checkResult.isCorrect && !showMeaning && (
                          <p className="text-sm font-medium text-slate-600 mt-0.5 animate-fade-in">
                            Nghĩa: <span className="text-emerald-600 font-semibold">{currentWord.meaning}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {checkResult && <VocabularyExamples examples={currentWord.examples} />}

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isLoading}
                      className="btn-check w-full flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                          Đang tải
                        </>
                      ) : (
                        <>
                          Tiếp theo
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Enter shortcut hint */}
              <p className="hidden sm:block text-center text-sm text-slate-400 mt-6">
                Nhấn <kbd className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-xs font-mono mx-1">Enter</kbd> để {checkResult ? 'tiếp theo' : 'kiểm tra'}
              </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (bottom) */}
      {currentWord && (
        <div className="study-progress px-4 sm:px-8 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                {currentWord.currentIndex + 1} / {currentWord.totalWords}
              </span>
              {studyMode !== 'flashcard' && (
                <span className="text-xs text-slate-400">
                  ✓ {currentWord.correctCount || 0} &nbsp; ✗ {currentWord.wrongCount || 0}
                </span>
              )}
            </div>
            <div
              className="progress-bar-container"
              role="progressbar"
              aria-label="Tiến độ bài học"
              aria-valuemin="0"
              aria-valuemax={currentWord.totalWords}
              aria-valuenow={currentWord.currentIndex + 1}
            >
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
