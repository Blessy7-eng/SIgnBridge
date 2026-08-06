import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import InterpreterPage from './pages/InterpreterPage';
import LearnPage from './pages/LearnPage';
import PracticePage from './pages/PracticePage';
import ChallengePage from './pages/ChallengePage';
import { ProgressProvider } from './ProgressContext';
import LoadingScreen from './components/LoadingScreen';

function AppRoutes() {
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    setShowLoading(true);
    const timer = window.setTimeout(() => setShowLoading(false), 850);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interpreter" element={<InterpreterPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:unitId/practice/:signName" element={<PracticePage />} />
        <Route path="/challenge" element={<ChallengePage />} />
      </Routes>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} label="Loading the next SignBridge page" />}
    </>
  );
}

function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ProgressProvider>
  );
}

export default App;
