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
  startSession: (setId, shuffle = false) => api.post(`/study/start/${setId}`, { shuffle }),

  getSession: (sessionId) => api.get(`/study/session/${sessionId}`),

  getCurrentWord: (sessionId) => api.get(`/study/session/${sessionId}/current`),

  checkAnswer: (sessionId, answer, hintsUsed) =>
    api.post(`/study/session/${sessionId}/check`, { answer, hintsUsed }),

  getHint: (sessionId, revealCount) =>
    api.post(`/study/session/${sessionId}/hint`, { revealCount }),

  nextWord: (sessionId) => api.post(`/study/session/${sessionId}/next`),

  previousWord: (sessionId) => api.post(`/study/session/${sessionId}/previous`),

  getResults: (sessionId) => api.get(`/study/session/${sessionId}/results`),
};

export default api;
