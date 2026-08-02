import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import StudyPage from '@/pages/StudyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study/:setId" element={<StudyPage />} />
        <Route path="/flashcards/:setId" element={<StudyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
