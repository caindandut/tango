import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import StudyPage from '@/pages/StudyPage';
import GrammarHomePage from '@/pages/GrammarHomePage';
import GrammarWeekPage from '@/pages/GrammarWeekPage';
import GrammarDayPage from '@/pages/GrammarDayPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/study/:setId" element={<StudyPage />} />
        <Route path="/flashcards/:setId" element={<StudyPage />} />
        <Route path="/grammar" element={<GrammarHomePage />} />
        <Route path="/grammar/weeks/:weekNumber" element={<GrammarWeekPage />} />
        <Route path="/grammar/weeks/:weekNumber/days/:dayNumber" element={<GrammarDayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
