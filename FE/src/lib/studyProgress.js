const STORAGE_KEY = 'tango_vocabulary_progress';

function getProgressMap() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};

    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getProgressKey(setId, shuffle) {
  return `${setId}:${shuffle ? 'shuffled' : 'ordered'}`;
}

function getPreferenceKey(setId) {
  return `${setId}:last-study-order`;
}

export function getStudyProgress(setId, shuffle) {
  return getProgressMap()[getProgressKey(setId, shuffle)] || null;
}

export function getStudyShufflePreference(setId) {
  const preference = getProgressMap()[getPreferenceKey(setId)];
  return typeof preference?.shuffle === 'boolean' ? preference.shuffle : false;
}

export function saveStudyProgress(setId, shuffle, progress) {
  try {
    const progressMap = getProgressMap();
    progressMap[getProgressKey(setId, shuffle)] = {
      ...(progressMap[getProgressKey(setId, shuffle)] || {}),
      ...progress,
    };
    progressMap[getPreferenceKey(setId)] = { shuffle };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  } catch {
    // Progress recovery is best-effort when storage is unavailable.
  }
}

export function clearStudyProgress(setId, shuffle) {
  try {
    const progressMap = getProgressMap();
    delete progressMap[getProgressKey(setId, shuffle)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
  } catch {
    // Progress recovery is best-effort when storage is unavailable.
  }
}
