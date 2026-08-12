import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vocabulary API
export const vocabularyApi = {
  getSets: () => api.get('/vocabulary/sets'),

  getSet: (id) => api.get(`/vocabulary/sets/${id}`),

  deleteSet: (id) => api.delete(`/vocabulary/sets/${id}`),
};

// Study API
export const studyApi = {
  startSession: (setId, shuffle = false, mode = 'reading') =>
    api.post(`/study/start/${setId}`, { shuffle, mode }),

  getSession: (sessionId) => api.get(`/study/session/${sessionId}`),

  changeMode: (sessionId, mode) => api.patch(`/study/session/${sessionId}/mode`, { mode }),

  getCurrentWord: (sessionId) => api.get(`/study/session/${sessionId}/current`),

  checkAnswer: (sessionId, answer, hintsUsed) =>
    api.post(`/study/session/${sessionId}/check`, { answer, hintsUsed }),

  getHint: (sessionId, revealCount) =>
    api.post(`/study/session/${sessionId}/hint`, { revealCount }),

  nextWord: (sessionId) => api.post(`/study/session/${sessionId}/next`),

  previousWord: (sessionId) => api.post(`/study/session/${sessionId}/previous`),

  getResults: (sessionId) => api.get(`/study/session/${sessionId}/results`),
};

export const dictionaryApi = {
  lookup: (term, sentence) => api.post('/dictionary/lookup', { term, sentence }),
};

export const grammarApi = {
  getWeeks: () => api.get('/grammar/weeks'),
  getWeek: (weekNumber) => api.get(`/grammar/weeks/${weekNumber}`),
  getDay: (weekNumber, dayNumber) => api.get(`/grammar/weeks/${weekNumber}/days/${dayNumber}`),
  checkQuestion: (weekNumber, dayNumber, questionId, answerOptionId) =>
    api.post(`/grammar/weeks/${weekNumber}/days/${dayNumber}/questions/${questionId}/check`, { answerOptionId }),
  gradeReview: (weekNumber, answers) =>
    api.post(`/grammar/weeks/${weekNumber}/days/7/grade`, { answers }),
};

export default api;
