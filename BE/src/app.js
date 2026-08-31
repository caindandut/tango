require('dotenv').config();

const express = require('express');
const cors = require('cors');
const vocabularyRoutes = require('./routes/vocabulary');
const studyRoutes = require('./routes/study');
const dictionaryRoutes = require('./routes/dictionary');
const { createGrammarRouter } = require('./routes/grammar');
const grammarCurriculum = require('./data/grammar/curriculum.json');
const { createGrammarService } = require('./grammar/grammarService');

const app = express();
const PORT = process.env.PORT || 3001;

// Render forwards the visitor IP through one trusted reverse proxy.
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/grammar', createGrammarRouter({
  service: createGrammarService(grammarCurriculum),
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large. Maximum is 100MB.' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

const seedVocabulary = require('./scripts/seedVocabulary');

// Seed database on server startup
async function startServer() {
  try {
    console.log('🔄 Syncing published vocabulary to Database...');
    await seedVocabulary();
  } catch (err) {
    console.error('⚠️ Failed to sync vocabulary on startup:', err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Tango API server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
