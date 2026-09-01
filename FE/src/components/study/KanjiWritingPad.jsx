import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eraser, PenLine, X } from 'lucide-react';

const MOBILE_QUERY = '(max-width: 640px)';
const KANJI_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u;

function useIsMobile() {
  const getIsMobile = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_QUERY).matches
  );
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  return isMobile;
}

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
  };
}

function drawPaths(canvas, paths) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * pixelRatio);
  const pixelHeight = Math.round(height * pixelRatio);
  const context = canvas.getContext('2d');

  if (!context) return;

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#172554';

  paths.forEach((path) => {
    if (path.length === 0) return;

    context.beginPath();
    context.moveTo(path[0].x, path[0].y);
    path.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
  });
}

export default function KanjiWritingPad({ currentWord }) {
  const kanji = currentWord?.kanji?.trim() || '';
  const isKanjiVocabulary = KANJI_PATTERN.test(kanji);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef(null);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const pathsRef = useRef([]);
  const activePathRef = useRef(null);

  const redrawCanvas = useCallback(() => {
    if (canvasRef.current) drawPaths(canvasRef.current, pathsRef.current);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !canvasRef.current) return undefined;

    redrawCanvas();
    const canvas = canvasRef.current;
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(redrawCanvas);
    resizeObserver?.observe(canvas.parentElement || canvas);
    window.addEventListener('resize', redrawCanvas);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', redrawCanvas);
    };
  }, [isOpen, redrawCanvas]);

  useEffect(() => {
    if (!isOpen) return undefined;

    closeRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePanel, isOpen]);

  if (!isKanjiVocabulary) return null;

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    const point = getCanvasPoint(event, event.currentTarget);
    const path = [point];
    pathsRef.current = [...pathsRef.current, path];
    activePathRef.current = path;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    redrawCanvas();
  };

  const handlePointerMove = (event) => {
    if (!activePathRef.current) return;

    activePathRef.current.push(getCanvasPoint(event, event.currentTarget));
    redrawCanvas();
  };

  const handlePointerEnd = (event) => {
    activePathRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const clearCanvas = () => {
    pathsRef.current = [];
    activePathRef.current = null;
    redrawCanvas();
  };

  return (
    <div className="kanji-writing-pad">
      <button
        ref={triggerRef}
        type="button"
        className="kanji-writing-pad__trigger"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="kanji-writing-pad-panel"
        aria-label="Mở bảng luyện viết Kanji"
        title="Luyện viết Kanji"
      >
        <PenLine className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">Luyện viết</span>
      </button>

      {isOpen && isMobile && (
        <div
          className="kanji-writing-pad__backdrop"
          data-testid="kanji-writing-pad-backdrop"
          onPointerDown={closePanel}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <section
          id="kanji-writing-pad-panel"
          className={`kanji-writing-pad__panel ${isMobile ? 'kanji-writing-pad__panel--mobile' : ''}`}
          role="dialog"
          aria-modal={isMobile ? 'true' : 'false'}
          aria-labelledby="kanji-writing-pad-title"
        >
          <div className="kanji-writing-pad__header">
            <div>
              <p className="kanji-writing-pad__eyebrow">Luyện viết</p>
              <h2 id="kanji-writing-pad-title">Luyện viết Kanji</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="kanji-writing-pad__close"
              onClick={closePanel}
              aria-label="Đóng bảng luyện viết Kanji"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="kanji-writing-pad__vocabulary">
            <span lang="ja" className="kanji-writing-pad__word font-japanese">{kanji}</span>
            {currentWord.hiragana && (
              <span lang="ja" className="kanji-writing-pad__reading font-japanese">{currentWord.hiragana}</span>
            )}
            {currentWord.meaning && <span className="kanji-writing-pad__meaning">{currentWord.meaning}</span>}
          </div>

          <div className="kanji-writing-pad__canvas-wrap" data-guide={kanji}>
            <canvas
              ref={canvasRef}
              className="kanji-writing-pad__canvas"
              role="img"
              aria-label="Vùng vẽ luyện viết Kanji"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              Vùng vẽ luyện viết Kanji
            </canvas>
          </div>

          <div className="kanji-writing-pad__footer">
            <p>Đồ theo mẫu mờ hoặc luyện viết tự do.</p>
            <button type="button" className="kanji-writing-pad__clear" onClick={clearCanvas}>
              <Eraser className="h-4 w-4" aria-hidden="true" />
              Xóa nét vẽ
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
