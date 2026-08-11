const STORAGE_KEY = 'tango.grammarProgress.v1';

const emptyProgress = () => ({
  version: 1,
  days: {},
});

export function readGrammarProgress(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 && parsed.days && typeof parsed.days === 'object'
      ? parsed
      : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeGrammarProgress(progress, storage = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updateGrammarDay(dayId, updater, storage = window.localStorage) {
  const current = readGrammarProgress(storage);
  const nextDay = updater(current.days[dayId] || {});
  const next = {
    ...current,
    days: { ...current.days, [dayId]: nextDay },
  };
  writeGrammarProgress(next, storage);
  return next;
}

export function getDayProgress(dayId, storage = window.localStorage) {
  return readGrammarProgress(storage).days[dayId] || {};
}

export function countCompletedDays(days, storage = window.localStorage) {
  const progress = readGrammarProgress(storage).days;
  return days.filter((day) => progress[day.id]?.completed).length;
}

export function formatRemainingTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainder = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export { STORAGE_KEY };
