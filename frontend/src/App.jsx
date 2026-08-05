import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InterpreterPage from './pages/InterpreterPage';
import LearnPage from './pages/LearnPage';
import PracticePage from './pages/PracticePage';
import ChallengePage from './pages/ChallengePage';
import { ProgressProvider } from './ProgressContext';

function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/interpreter" element={<InterpreterPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:unitId/practice/:signName" element={<PracticePage />} />
          <Route path="/challenge" element={<ChallengePage />} />
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  );
}

export default App;